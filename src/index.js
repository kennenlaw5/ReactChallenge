import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import GoGame from './go';
import TicTacToeGame from './tic-tac-toe';

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedGame: null,
        };
    }

    render () {
        return (
            <div className={'container'} style={{textAlign: 'center'}}>
                <div style={{marginBottom: '10px'}}>
                    <label htmlFor="versus">Game: </label>
                    <div className='select is-small' style={{marginBottom: '3px'}}>
                        <select className='dropdown'
                                style={{borderRadius: '2px', fontSize: '12px', padding: '0px 30px 0px 6px'}}
                                name="selectedGame" id="selectedGame" onChange={(e) => {
                            this.setState({selectedGame: e.target.value});
                        }} value={this.state.selectedGame} placeholder='Select Game...'>
                            <option value="none">Select Game...</option>
                            <option value="GoGame">Go</option>
                            <option value="TicTacToeGame">Tic-Tac-Toe</option>
                        </select>
                    </div>
                </div>
                {this.state.selectedGame === 'GoGame' ? <GoGame/>
                : this.state.selectedGame === 'TicTacToeGame' ? <TicTacToeGame/>
                : <p>Please select a game!</p>}
            </div>
        )
    };
}

ReactDOM.render(<Game/>, document.getElementById('root'));
