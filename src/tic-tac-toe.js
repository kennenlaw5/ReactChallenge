import React from 'react';

function Square(props) {

    return (
        <button className="square" style={{fontSize: '60px', backgroundColor: props.highlight ? '#8CC152' : 'White'}} onClick={props.onClick}>
            {props.value}
        </button>
    );
}

class Board extends React.Component {
    renderBoard() {
        let board = [];

        for (let i = 0; i < 3; i++) {
            let squares = [];

            for (let j = 0; j < 3; j++) {
                squares.push(this.renderSquare((i * 3) + j));
            }

            board.push(<div className="board-row" key={i}>{squares}</div>);
        }

        return (board)
    }

    renderSquare(i) {
        return (
            <Square
                value={this.props.squares[i]}
                highlight={this.props.winningSquares.indexOf(i) !== -1}
                onClick={() => this.props.onClick(i)}
                key={i}
            />
        );
    }

    render() {
        return (
            <div>
                {this.renderBoard()}
            </div>
        );
    }
}

export default class TicTacToeGame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [{
                squares: Array(9).fill(null),
            }],
            stepNumber: 0,
            reverseOrder: false,
            xIsNext: true,
        };
    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();

        if (calculateWinner(squares) || squares[i]) {
            return;
        }

        squares[i] = this.state.xIsNext ? 'X' : 'O';
        this.setState({
            history: history.concat([{
                squares,
            }]),
            stepNumber: history.length,
            xIsNext: !this.state.xIsNext,
        });
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0,
        });
    }

    location(move) {
        const history  = this.state.history.slice(0, move + 1);
        const current  = history[history.length - 1].squares.slice();
        const previous = history[history.length - 2].squares.slice();

        for(let i in current) {
            if (current[i] !== previous[i]) {
                return ' (' + ((i % 3) + 1) + ', ' + (parseInt(i / 3) + 1) + ')';
            }
        }
    }

    clear() {
        this.setState({
            history: [{
                squares: Array(9).fill(null),
            }],
            stepNumber: 0,
            reverseOrder: false,
            xIsNext: true,
        })
    }

    render() {
        const history      = this.state.history;
        const current      = history[this.state.stepNumber];
        let winner         = calculateWinner(current.squares);
        let winningSquares = [];
        let status;

        if (winner !== null && winner !== 'Tied game') {
            winningSquares = winner[1];
            winner         = winner[0];
        }

        const moves = history.map((step, move) => {
            const currentMove = this.state.reverseOrder ? history.length - 1 - move : move;
            let desc          = currentMove ?
                'Go to move #' + currentMove + this.location(currentMove) :
                'Go to game start';
            desc              = currentMove === history.length - 1 ? <b>{desc}</b> : desc;

            return (
                <li key={move}>
                    <button className='button' style={{fontSize: '12px'}} onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            );
        });

        if (winner) {
            status = winner === 'Tied game' ? winner : <b>Winner: {winner}</b>;
        } else {
            status = 'Next player: ' + (this.state.xIsNext ? 'X' : 'O');
        }

        return (
            <div className="game" style={{display: 'inline-block'}}>
                <Board
                    squares={current.squares}
                    winningSquares={winningSquares}
                    onClick={i => this.handleClick(i)}
                />
                <div style={{marginBottom: '5px', marginTop: '5px', fontSize: '20px'}}>{status}</div>
                <button onClick={() => this.setState({reverseOrder: !this.state.reverseOrder})}
                        className='button is-info'
                        style={{fontSize: '12px', marginBottom: '5px', marginRight: '5px'}}
                >
                    Toggle Order
                </button>
                <button onClick={() => this.clear()}
                        className='button is-danger'
                        style={{fontSize: '12px', marginBottom: '5px'}}
                >
                    Reset
                </button>
                <ol>{moves}</ol>
            </div>
        );
    }
}

function calculateWinner(squares) {
    const fullBoard = squares.indexOf(null) === -1;
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return [squares[a], lines[i]];
        }
    }
    if (fullBoard) {
        return 'Tied game';
    }
    return null;
}