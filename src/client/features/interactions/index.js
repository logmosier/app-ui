const React = require('react');
const h = require('react-hyperscript');
const _ = require('lodash');
const queryString = require('query-string');
const Loader = require('react-loader');

const make_cytoscape = require('../../common/cy/');

const { ServerAPI } = require('../../services/');

const { BaseNetworkView } = require('../../common/components');
const { getLayoutConfig } = require('../../common/cy/layout');

class Interactions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cy: make_cytoscape({ headless: true }),
      componentConfig: {},
      layoutConfig: {},
      networkJSON: {},
      networkMetadata: {
        name: '',
        datasource: '',
        comments: []
      },
      loading: true,
    };    
    const query = queryString.parse(props.location.search);
    ServerAPI.getNeighborhood(query.ID).then(res=>{ 
      const layoutConfig = getLayoutConfig(null);//null to get the base layout
      const componentConfig = _.merge({}, BaseNetworkView.config, { useSearchBar: true});
      const network= this.parse(res,query.ID);
      this.setState({
        componentConfig: componentConfig,
        layoutConfig: layoutConfig,
        networkJSON: network ,
        networkMetadata: {
          name: query.ID,
          datasource: 'Pathway Commons',
        },
        loading: false
      }); 
    });
  }

  edgeTypeing(type){
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

  findId(data,id){
    return data.filter(line => line.includes(id))[0].split('	')[0];
  }
  //Quick Function made to try and find a neighborhood with few members
  // sizecheck(data){
  //   const splitByLines=data.split('\n');
  //   let i=1;
  //   while (splitByLines[i]){ 
  //     i++;
  //   }
  //   i+=2;
  //   while(splitByLines[i]){
  //     let splitLine=splitByLines[i].split('\t');
  //     let id=splitLine[3].slice(-6);
  //     ServerAPI.getNeighborhood(id).then(res=>{
  //       this.parse(res,id);
  //     });
  //   i++;
  //   }
  // }

  parse(data,query){
    let network = {
      edges:[],
      nodes:[],
      parseType:"jsonld",
      pathwayMetadata:{comments: [], dataSource: [], organism: [], title: [], uri: "http://identifiers.org/reactome/R-HSA-6804760"}
    };
    let nodeMap=new Map(); //keeps track of nodes that have already been added
    const splitByLines=data.split('\n');
    const id=this.findId(splitByLines,query);

    for(let j= 0; j<2; j++){
      let i=1;
      while (splitByLines[i]){ 
        let splitLine=splitByLines[i].split('\t');
        if(splitLine[0]===id || splitLine[2]===id || (nodeMap.has(splitLine[0]) &&nodeMap.has(splitLine[2]))){ //if it is a interaction with the main node or 2 nodes conected to the main node
          if(!nodeMap.has(splitLine[0])){
            nodeMap.set(splitLine[0],true);
            network.nodes.push({data:{bbox:{h:15,w:15,x:7.5,y:7.5},class: "ball",clonemarker:false,id: splitLine[0],label: splitLine[0],parsedMetadata:[],stateVariables:[],unitsOfInformation:[]}});
          }
          if(!nodeMap.has(splitLine[2])){
            nodeMap.set(splitLine[2],true);
            network.nodes.push({data:{bbox:{h:15,w:15,x:7.5,y:7.5},class: "ball",clonemarker:false,id: splitLine[2],label: splitLine[2],parsedMetadata:[],stateVariables:[],unitsOfInformation:[]}});
          }
          network.edges.push({data: {
            id: splitLine[0]+splitLine[1]+splitLine[2] ,
            label:splitLine[0]+' '+splitLine[1]+' '+splitLine[2] ,
            source:splitLine[0],
            target: splitLine[2],
            class: this.edgeTypeing(splitLine[1]),
            parsedMetadata:[['Database IDs',splitLine[6].split(';')]]
          }});
        }
        i++;
      }
    }
    return network;
  }

  render(){
    const state = this.state;
    const baseView = h(BaseNetworkView.component, {
      layoutConfig: state.layoutConfig,
      componentConfig: state.componentConfig,
      cy: state.cy,
      networkJSON: state.networkJSON,
      networkMetadata: state.networkMetadata
    });
    const loadingView = h(Loader, { loaded: !state.loading, options: { left: '50%', color: '#16A085' }});

    // create a view shell loading view e.g looks like the view but its not
    const content = state.loading ? loadingView : baseView;
    return h('div', [content]);
  }
}
module.exports = Interactions;