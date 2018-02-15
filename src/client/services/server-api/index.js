const io = require('socket.io-client');
const qs = require('querystring');
const _ = require('lodash');

const socket = io.connect('/');

const defaultFetchOpts = {
  method: 'GET', headers: {
    'Content-type': 'application/json',
    'Accept': 'application/json'
  }
};

const ServerAPI = {
  getGraphAndLayout(uri, version) {
    return fetch(`/api/get-graph-and-layout?${qs.stringify({uri, version})}`, defaultFetchOpts).then(res => res.json());
  },

  pcQuery(method, params){
    return fetch(`/pc-client/${method}?${qs.stringify(params)}`, defaultFetchOpts);
  },

  datasources(){
    return fetch('/pc-client/datasources', defaultFetchOpts).then(res => res.json());
  },

  querySearch(query){
    return fetch(`/pc-client/querySearch?${qs.stringify(query)}`, defaultFetchOpts).then(res => res.json());
  },

  findUniprotId(query){
  return fetch(`/pc-client/querySearch?${qs.stringify(query)}`, defaultFetchOpts).then(res => res.json()).then(res=> {
    return _.compact(res.map(hit=>{
        if( hit.uri.startsWith('http://identifiers.org/uniprot/') && ( _.isUndefined(query.species)|| _.endsWith(hit.organism[0],query.species))) {
         return _.last(hit.uri.split('/')); //Parses and returns the Uniprot id
        }
      }));
    });
  },

  getProteinInformation(uniprotId){
    return fetch(`https://www.ebi.ac.uk/proteins/api/proteins?offset=0&size=1&accession=${uniprotId}`,defaultFetchOpts).then(res => res.json());
  },

  getNeighborhood(uniprotId){
    return fetch(`http://www.pathwaycommons.org/pc2/graph?source=http://identifiers.org/uniprot/${uniprotId}&kind=neighborhood&format=TXT&pattern=controls-phosphorylation-of
    &pattern=in-complex-with&pattern=controls-expression-of&pattern=interacts-with`,defaultFetchOpts).then(res => res.text());
  },
  // Send a diff in a node to the backend. The backend will deal with merging these diffs into
  // a layout
  submitNodeChange(uri, version, nodeId, bbox) {
    socket.emit('submitDiff', {
      uri: uri,
      version: version.toString(),
      diff: {
        nodeID: nodeId,
        bbox: bbox
      } 
    });
  },

  submitLayoutChange(uri, version, layout) {
    socket.emit('submitLayout', {
      uri: uri,
      version: version,
      layout: layout
    });
  },

  initReceiveLayoutChange(callback) {
    socket.on('layoutChange', layoutJSON => {
      callback(layoutJSON);
    });
  },

  initReceiveNodeChange(callback) {
    socket.on('nodeChange', nodeDiff => {
      callback(nodeDiff);
    });
  },

};

module.exports = ServerAPI;