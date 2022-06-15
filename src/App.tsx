import React from 'react'

// Components
import Header from './components/Header'
import Main from './components/Main'


function App() {
  return (
    <div className="App" style={{ backgroundColor: '#eee', color: '#000' }}>
      <Header />
      <Main />
      {/* <Footer /> */}
    </div>
  );
}

export default App;
