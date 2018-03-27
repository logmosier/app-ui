const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const Loader = require('react-loader');

const make_cytoscape = require('../../common/cy/');
const interactionsStylesheet= require('../../common/cy/interactions-stylesheet');
const { ServerAPI } = require('../../services/');

const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');
const downloadTypes = require('../../common/config').downloadTypes;

const interactionsConfig={
  toolbarButtons:_.differenceBy(BaseNetworkView.config.toolbarButtons,[{'id': 'expandCollapse'}],'id'),
  menus: BaseNetworkView.config.menus,
  useSearchBar: true
};  

class Interactions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cy: make_cytoscape({ headless: true, stylesheet: interactionsStylesheet, showTooltipsOnEdges:true }),
      componentConfig: {},
      layoutConfig: {},
      networkJSON: {},
      networkMetadata: {
        name: '',
        datasource: '',
        comments: []
      },
      id:'',
      loading: true,
    };    

    const query = queryString.parse(props.location.search);
    if(query.id.constructor != Array){query.id=[query.id];}
      ServerAPI.getNeighborhood(query.id,query.kind).then(res=>{ 
      const layoutConfig = getLayoutConfig('interactions');
      const network= this.parse(res,query.id);
      this.setState({
        componentConfig: interactionsConfig,
        layoutConfig: layoutConfig,
        networkJSON: network.network ,
        networkMetadata: Object.assign({}, this.state.networkMetadata, {
          name: (network.id.join(' , ')+' Interactions'),
          datasource: 'Pathway Commons',
        }),
        id: network.id,
        loading: false
      }); 
    });

    ServerAPI.getProteinInformation(query.id).then(results=>{
      const comments=_.flatten(results.map(result=>
        _.compact([
          'Full Name: '+result.protein.recommendedName.fullName.value,
          result.protein.alternativeName && 'Synonyms: '+result.protein.alternativeName.map(obj => obj.fullName.value).join(', '),
          result.comments[0].type==='FUNCTION'&&'Function: '+result.comments[0].text[0].value
        ])
      ));

      this.setState({
      networkMetadata: Object.assign({}, this.state.networkMetadata, {
        comments: comments
      }),
     }); 
    });

    this.state.cy.on('trim', () => {
      const mainNode=this.state.cy.nodes(node=> _.indexOf(this.state.id,node.data().id)!=-1);
      const nodesToKeep=mainNode.merge(mainNode.connectedEdges().connectedNodes());
      this.state.cy.remove(this.state.cy.nodes().difference(nodesToKeep));
    });
  }

  edgeType(type){
    switch(type){
      case 'in-complex-with':
      case 'interacts-with':
        return 'Binding';
      case 'controls-phosphorylation-of':
        return 'Phosphorylation';
      case 'controls-expression-of':
        return 'Expression';
      default:
        return '';
    }
  }

  findId(data,ids){
    let hgncId=[];
    data.forEach((value,key)=> {
      if (new RegExp(ids.join("|")).test(value[2])){
        hgncId.push(key); 
      }
    });
    return hgncId;
  }

  interactionMetadata(mediatorIds,pubmedIds){
    let metadata = [['Detailed views',[]],['Database IDs',[]]];//Format expected by format-content
    mediatorIds.split(';').forEach( link => {
      const splitLink=link.split('/');
      const view = splitLink[2]==='pathwaycommons.org';
      view ? metadata[0][1].push(['Pathway Commons',splitLink[4]]) :
        metadata[1][1].push(['Reactome',splitLink[4]]);
    });
    if(pubmedIds){
     pubmedIds.split(';').forEach(id=>metadata[1][1].push(['PubMed_Interactions',id]));
    }
   return metadata;
}

  addInteraction(nodes,edge,sources,network,nodeMap,nodeMetadata){
    const interaction= this.edgeType(edge);
   nodes.forEach((node)=>{
    if(!nodeMap.has(node)){
      const metadata=nodeMetadata.get(node);
      nodeMap.set(node,true);
      const links=_.uniqWith(_.flatten(metadata.slice(-2).map(entry => entry.split(';').map(entry=>entry.split(':')))),_.isEqual).filter(entry=>entry[0]!='intact');       
      network.nodes.push({data:{class: "ball",id: node,label: node,parsedMetadata:[
        ['Type','bp:'+metadata[0].split(' ')[0].replace(/Reference/g,'').replace(/;/g,',')],['Database IDs', links]]}});
      }
    });

    network.edges.push({data: {
      id: nodes[0]+'\t'+edge+'\t'+nodes[1] ,
      label: nodes[0]+' '+edge.replace(/-/g,' ')+' '+nodes[1] ,
      source: nodes[0],
      target: nodes[1],
      class: interaction,
      parsedMetadata:sources
    },classes:interaction});
  }

  parse(data,query){
    let network = {
      edges:[],
      nodes:[],
    };
    let nodeMap=new Map(); //keeps track of nodes that have already been added
    if(data){
      const dataSplit=data.split('\n\n');
      const nodeMetadata= new Map(dataSplit[1].split('\n').slice(1).map(line =>line.split('\t')).map(line => [line[0], line.slice(1) ]));
      dataSplit[0].split('\n').slice(1).forEach(line => {
        const splitLine=line.split('\t');
        const edgeMetadata = this.interactionMetadata(splitLine[6],splitLine[4]);
        this.addInteraction([splitLine[0],splitLine[2]],splitLine[1],edgeMetadata,network,nodeMap,nodeMetadata);
      });
      const id=this.findId(nodeMetadata,query);
      return {id,network};
    }
    else{
      return {id:[],network:{}};
    }
  }

  render(){
    const state = this.state;
    const networkToDisplay=!_.isEmpty(state.networkJSON) && !_.isEmpty(state.id);
    const baseView = networkToDisplay ? h(BaseNetworkView.component, {
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cy: state.cy,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata,
      //interaction specific
      download: {
        types: downloadTypes.filter(ele=>ele.type==='png'||ele.type==='sif'), 
        promise: () => Promise.resolve(_.map(state.cy.edges(),edge=> edge.data().id).sort().join('\n'))
      },
    }):
    h('div','No interactions to display');

    const loadingView = h(Loader, { loaded: !state.loading, options: { left: '50%', color: '#16A085' }});

    // create a view shell loading view e.g looks like the view but its not
    const content = state.loading ? loadingView : baseView;
    return h('div', [content]);
  }
}
module.exports = Interactions;