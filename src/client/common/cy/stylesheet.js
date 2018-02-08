const cytoscape = require('cytoscape');
const sbgnStyleSheet = require('cytoscape-sbgn-stylesheet');

const stylesheet = sbgnStyleSheet(cytoscape)
.selector('node')
.css({
  'background-opacity': '0.4'
})
.selector('node:active')
.css({
  'background-opacity': '0.7',
})
.selector('node[class!="compartment"]')
.css({
  'font-size': 20,
  'color': 'black',
  'text-outline-color': 'white',
  'text-outline-width': 2,
  'text-outline-opacity': 0.5,
  'text-wrap': 'wrap',
  'text-max-width': 175,
  'label': node => {
    const label = node.data('label')
      .split('(').join('').split(')').join('')
      .split(':').join(' ');
    return label;
  }
})
.selector('node[class="complex"]')
.css({
  'width': 45,
  'height': 45,
  'label': node => node.isParent() ? '' : node.data('label')
})
.selector('.compoundcollapse-collapsed-node')
.css({
  'font-size': 20,
  'text-max-width': 175
})
.selector('edge')
.css({
  'opacity': 0.3
})
.selector('edge[class="controls-phosphorylation-of"]')
.css({
  'line-color': 'red'
})
.selector('edge[class="controls-expression-of"]')
.css({
  'line-color': 'green'
})
.selector('edge[class="in-complex-with"]')
.css({
  'line-color': 'blue'
})
.selector('edge[class="interacts-with"]')
.css({
  'line-color': 'yellow'
})
.selector('edge[class="consumption-controlled-by"]')
.css({
  'line-color': 'darkRed'
})
.selector('edge[class="controls-production-of	"]')
.css({
  'line-color': 'darkMagenta'
})
.selector('edge[class="controls-transport-of-chemical"]')
.css({
  'line-color': 'darkGreen'
})
.selector('edge[class="chemical-affects"]')
.css({
  'line-color': 'aquamarine'
})
.selector('edge[class="controls-state-change-of"]')
.css({
  'line-color': 'MediumVioletRed '
})
.selector('edge[class="neighbor-of"]')
.css({
  'line-color': 'purple'
});

module.exports = stylesheet;