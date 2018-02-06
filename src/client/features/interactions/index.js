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
      console.log(query.ID);
      ServerAPI.getNeighbors('P61244').then(res=>{ 
        console.log({res});
        const layoutConfig = getLayoutConfig(null);
        const componentConfig = _.merge({}, BaseNetworkView.config, { useSearchBar: true});
        const network= this.parse(res);
        this.setState({
          componentConfig: componentConfig,
          layoutConfig: layoutConfig,
          networkJSON: network ,
          networkMetadata: {
            uri: '',
            name: '',
            datasource: '',
            comments: '',
            organism: ''
          },
          loading: false
        }); 
      });
    }

  parse(data){
    let network = {
      edges:[],
      nodes:[],
      parseType:"jsonld",
      pathwayMetadata:{comments: [], dataSource: [], organism: [], title: [], uri: "http://identifiers.org/reactome/R-HSA-6804760"}
    };
    let nodeMap=new Map();
    const splitByLines=data.split('\n');
    for(let i=1; i<500; i++){
    let splitLine=splitByLines[i].split('\t');
    if(!nodeMap.has(splitLine[0])){
      nodeMap.set(splitLine[0],true);
      network.nodes.push({data:{bbox:{h:15,w:15,x:7.5,y:7.5},class: "complex",clonemarker:false,id: splitLine[0],label: splitLine[0],parsedMetadata:[],stateVariables:[],unitsOfInformation:[]}});
    }
    if(!nodeMap.has(splitLine[2])){
      nodeMap.set(splitLine[2],true);
      network.nodes.push({data:{bbox:{h:15,w:15,x:7.5,y:7.5},class: "complex",clonemarker:false,id: splitLine[2],label: splitLine[2],parsedMetadata:[],stateVariables:[],unitsOfInformation:[]}});
    }
    network.edges.push({data: {id: splitLine[0]+splitLine[1]+splitLine[2]+'' ,source:splitLine[0],target: splitLine[2]}});
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