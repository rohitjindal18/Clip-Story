import React, { Component } from 'react';
import Story from './Story';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <Story/>
        </header>
      </div>
    );
  }
}

export default App;
