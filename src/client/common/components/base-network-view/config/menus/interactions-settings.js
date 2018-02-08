const React = require('react');
const h = require('react-hyperscript');
const FlatButton = require('../../../flat-button');

class InteractionsSettingsMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state={
      savedCatagories: new Map ()
    };
    this.handelClick.bind(this);
  }

  handelClick (e) {
    const saved = this.state.savedCatagories;
    if(!saved.has(e.target.textContent)){
      const edges= this.props.cy.edges().filter(`[class="${e.target.textContent}"]`);
      const toSave = edges.union(edges.connectedNodes());
      if(toSave.length){
      this.setState({
        savedCatagories: saved.set(e.target.textContent, toSave)
      });
      }
      this.props.cy.remove(toSave);
    }
    else{ 
      this.setState({
        savedCatagories: saved.delete(e.target.textContent)
      });
      this.props.cy.add(saved.get(e.target.textContent));
    }
  }

  render(){
    //const handelClick=this.handelClick();
    const buttons= ['controls-phosphorylation-of' , 'controls-expression-of','in-complex-with','interacts-with','neighbor-of','consumption-controlled-by','controls-production-of'	,'controls-transport-of-chemical','chemical-affects'
    ].map(but=>h(FlatButton,{children:but, onClick: (e) => this.handelClick(e),key:but}));
    return h('div',[buttons]);
    }
  

}
module.exports = InteractionsSettingsMenu;