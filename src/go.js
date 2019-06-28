import React from "react";

function Square(props) {
    return (
        <button className="square" style={{backgroundColor: props.value}} onClick={props.onClick}> </button>
    );
}

class Board extends React.Component {
    renderBoard() {
        let board = [];

        for (let i = 0; i < 10; i++) {
            let squares = [];

            for (let j = 0; j < 10; j++) { squares.push(this.renderSquare(i, j)); }

            board.push(<div className="board-row" key={i}>{squares}</div>);
        }

        return (board)
    }

    renderSquare(row, col) {
        return (
            <Square
                value={this.props.squares[row][col]}
                onClick={() => this.props.onClick(row, col)}
                key={row + ',' + col}
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

export default class GoGame extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            squares: Array(10).fill(Array(10).fill(null)),
            previousMoves: {
                locations: [],
                moves: [],
            },
            currentMove: 0,
            redIsNext: true,
            colors: {
                user: 'Red',
                ai: 'Blue',
            },
            scores: {
                red: 0,
                blue: 0,
            },
            versus: 'human',
            level: 'Hard',
            winner: null,
        };
    }

    handleClick(row, col) {
        const squares = this.state.squares.slice();

        for (let i in squares) {
            squares[i] = squares[i].slice();
        }

        if (squares[row][col]) return;

        squares[row][col] = this.state.redIsNext ? 'Red' : 'Blue';

        this.runAI(squares, row, col);

        this.setState({currentMove: this.state.currentMove + 1});
    }

    previousMove() {
        const currentMove = this.state.currentMove - 1;

        if (currentMove < 0) return;

        let previousMoves  = this.state.previousMoves;
        const previousMove = previousMoves.moves[currentMove];
        const scores       = this.scoreCount(previousMove);
        const redIsNext    = this.state.versus === 'computer' ? true : !this.state.redIsNext;

        previousMoves.moves.splice(currentMove, 1);
        previousMoves.locations.splice(currentMove, 1);

        this.setState({squares: previousMove, previousMoves, winner: null, redIsNext, scores, currentMove});
    }

    runAI(board, row, col) {
        const userColor = this.state.colors.user;
        const aiColor   = this.state.colors.ai;

        let aiR      = row;
        let aiC      = col;
        let count    = 0;
        let ccCount  = 0;
        let uCount   = 0;
        let aiMove   = false;
        let possible = true;
        let temp     = false;
        let valid    = true; //Whether or not move is valid. I.E. not trying to edit something they shouldn't
        let sel      = [];
        let previousMoves, previousLocations;

        board = GoGame.updateBoard(board, this.state.versus === 'human' ? [] : [this.state.colors.user, this.state.colors.ai]);

        // count current number of red and blue squares on the board
        let scores    = this.scoreCount(board);
        let countRed  = scores.red;
        let countBlue = scores.blue;

        // check if playing against a human or an AI
        if (this.state.versus === 'human') {
            this.userChecks(board, row, col);
            return;
        }

        let lvl = this.state.level;

        if (lvl === 'Easy') {
            lvl = 1;
        } else if (lvl === 'Medium') {
            lvl = 2;
        } else {
            lvl = 3;
        }

        // check what color the user wants to play as and set AI as opposite and assign score values
        let userScore = userColor === 'Red' ? countRed : countBlue;
        let aiScore   = userColor === 'Red' ? countBlue : countRed;



        if (countRed + countBlue >= 100) {
            this.checkForWinner(countRed, countBlue);
            this.setState({squares: board, scores});
            return;
        }

        // Do NOT combine into single "for" statement!
        // Pre-check for places where user/ai has 3/4 spaces needed for a trap, or takeover
        if (lvl !== 1) { // medium
            // Check if AI can takeover player square
            for (let i = 0; i < board.length && !aiMove; i++) {
                for (let j = 0; j < board[i].length && !aiMove; j++) {
                    if (board[i][j] === userColor) {
                        aiMove = this.makeMove(aiColor, aiColor, 3, board, i, j, true);
                        board  = aiMove.aiMove ? aiMove.board : board;
                        if (aiMove.aiMove) console.log('Check if AI can takeover player square @ ' + aiMove.sel);
                        aiMove = aiMove.aiMove;
                    }
                }
            }

            if (!aiMove) {
                // See if User can takeover AI square
                for (let i = 0; i < board.length && !aiMove; i++) {
                    for (let j = 0; j < board[i].length && !aiMove; j++) {
                        if (!aiMove && board[i][j] === aiColor) {
                            aiMove = this.makeMove(userColor, aiColor, 3, board, i, j);
                            board  = aiMove.aiMove ? aiMove.board : board;
                            if (aiMove.aiMove) console.log('See if User can takeover AI square @ ' + aiMove.sel);
                            aiMove = aiMove.aiMove;
                        }
                    }
                }
            }

            if (!aiMove) {
                // Block player trap
                for (let i = 0; i < board.length && !aiMove; i++) {
                    for (let j = 0; j < board[i].length && !aiMove; j++) {
                        if (!aiMove && board[i][j] === null) {
                            aiMove = this.makeMove(userColor, aiColor, 3, board, i, j);
                            board  = aiMove.aiMove ? aiMove.board : board;
                            if (aiMove.aiMove) console.log('Block player trap @ ' + aiMove.sel);
                            aiMove = aiMove.aiMove;
                        }
                    }
                }
            }

            if (!aiMove) {
                // Set AI trap
                for (let i = 0; i < board.length && !aiMove; i++) {
                    for (let j = 0; j < board[i].length && !aiMove; j++) {
                        if (!aiMove && board[i][j] === null) {
                            aiMove = this.makeMove(aiColor, aiColor, 3, board, i, j);
                            board  = aiMove.aiMove ? aiMove.board : board;
                            if (aiMove.aiMove) console.log('Set AI trap @ ' + aiMove.sel);
                            aiMove = aiMove.aiMove;
                        }
                    }
                }
            }
        } // end of medium check for 3/4 takeovers or traps

        // have AI check surroundings so it doesn't lose blocks
        if (!aiMove) { // easy - always runs
            for (let l = 0; l < 2 && !aiMove; l++) {
                if (l === 1) {
                    temp      = aiScore;
                    aiScore   = userScore;
                    userScore = temp;
                }

                for (let i = 0; i < board.length && !aiMove; i++) {
                    for (let j = 0; j < board[i].length && !aiMove; j++) {
                        // If AI is ahead, start building takeovers, else start blocking takeovers
                        if (aiScore >= userScore - 1 && board[i][j] === userColor) {
                            aiMove = this.makeMove(aiColor, aiColor, 2, board, i, j);
                            board  = aiMove.aiMove ? aiMove.board : board;
                            if (aiMove.aiMove) console.log('start building takeovers @ ' + aiMove.sel);
                            aiMove = aiMove.aiMove;
                        } else if (board[i][j] === aiColor) {
                            aiMove = this.makeMove(userColor, aiColor, 2, board, i, j);
                            board  = aiMove.aiMove ? aiMove.board : board;
                            if (aiMove.aiMove) console.log('start blocking takeovers @ ' + aiMove.sel);
                            aiMove = aiMove.aiMove;
                        }
                    }
                }

                if (l === 1) {
                    temp      = aiScore;
                    aiScore   = userScore;
                    userScore = temp;
                } //change the scores back if swapped
            }
        }

        if (!aiMove && lvl === 3) { // hard
            // have AI check for places to make new surroundings/traps
            for (let l = 0; l < 2 && !aiMove; l++) {
                if (l === 1) {
                    temp      = aiScore;
                    aiScore   = userScore;
                    userScore = temp;
                }

                for (let k = 2; k > 0 && !aiMove; k--) {
                    for (let i = 0; i < board.length && !aiMove; i++) {
                        for (let j = 0; j < board[i].length && !aiMove; j++) {
                            if (board[i][j] === null) {
                            // If AI is ahead in points start new traps, else block traps user is building
                                if (aiScore >= userScore - 1) {
                                    aiMove = this.makeMove(aiColor, aiColor, k, board, i, j);
                                    board  = aiMove.aiMove ? aiMove.board : board;
                                    if (aiMove.aiMove) console.log('start new traps @ ' + aiMove.sel);
                                    aiMove = aiMove.aiMove;
                                } else {
                                    aiMove = this.makeMove(userColor, aiColor, k, board, i, j);
                                    board  = aiMove.aiMove ? aiMove.board : board;
                                    if (aiMove.aiMove) console.log('block traps user is building @ ' + aiMove.sel);
                                    aiMove = aiMove.aiMove;
                                }
                            }
                        }
                    }
                }

                if (l === 1) {
                    temp      = aiScore;
                    aiScore   = userScore;
                    userScore = temp;
                }
            }
        }

        if (!aiMove && lvl === 3) {
            // Before making random move, check for areas that traps can be made in
            for (let i = 0; i < board.length && !aiMove; i++) {
                for (let j = 0; j < board[i].length && !aiMove; j++) {
                    if (board[i][j] === null) {
                        possible = true;
                        valid    = false;
                        ccCount  = 0;

                        if (i - 1 >= 0) {
                            if (board[i - 1][j] === null) {
                                ccCount++;
                                sel   = [i - 1, j];
                                valid = this.checkMove(board, sel);
                            } else {
                                possible = false;
                            }
                        } else {
                            ccCount++;
                        }

                        if (possible) {
                            if (j - 1 >= 0) {
                                if (board[i][j - 1] === null) {
                                    ccCount++;

                                    if (!valid) {
                                        sel   = [i, j - 1];
                                        valid = this.checkMove(board, sel);
                                    }
                                } else {
                                    possible = false;
                                }
                            } else {
                                ccCount++;
                            }
                        }

                        if (possible) {
                            if (i + 1 <= 9) {
                                if (board[i + 1][j] === null) {
                                    ccCount++;

                                    if (!valid) {
                                        sel   = [i + 1, j];
                                        valid = this.checkMove(board, sel);
                                    }
                                } else {
                                    possible = false;
                                }
                            } else {
                                ccCount++;
                            }
                        }

                        if (possible){
                            if (j + 1 <= 9) {
                                if (board[i][j + 1] === null) {
                                    ccCount++;

                                    if (!valid) {
                                        sel   = [i, j + 1];
                                        valid = this.checkMove(board, sel);
                                    }
                                } else {
                                    possible = false;
                                }
                            } else {
                                ccCount++;
                            }
                        }

                        if (possible && ccCount === 4 && valid) {
                            console.log('check for areas that traps can be made in @ ' + [i, j]);
                            board[sel[0]][sel[1]] = aiColor;
                            aiMove                = true;
                        }
                    }
                }
            }
        }

        if (!aiMove && lvl === 3) {
            // Before making random move, check for available moves that avoid traps
            for (let i = 0; i < board.length && !aiMove; i++) {
                for (let j = 0; j < board[i].length && !aiMove; j++) {
                    if (board[i][j] === null) {
                        ccCount = 0;
                        count   = 0;
                        uCount  = 0;
                        
                        if (i - 1 >= 0) {
                            if (board[i - 1][j] === aiColor) ccCount++;
                            else if (board[i - 1][j] === userColor) uCount++;
                        } else {
                            count++;
                        }

                        if (j - 1 >= 0) {
                            if (board[i][j - 1] === aiColor) ccCount++;
                            else if (board[i][j - 1] === userColor) uCount++;
                        } else {
                            count++;
                        }

                        if (i + 1 <= 9) {
                            if (board[i + 1][j] === aiColor) ccCount++;
                            else if (board[i + 1][j] === userColor) uCount++;
                        } else {
                            count++;
                        }

                        if (j + 1 <= 9) {
                            if (board[i][j + 1] === aiColor) ccCount++;
                            else if (board[i][j + 1] === userColor) uCount++;
                        } else {
                            count++;
                        }

                        if (count + ccCount < 4 && count + uCount < 4) {
                            console.log('Before making random move, check for available moves that avoid traps @ ' + [i, j]);
                            board[i][j] = aiColor;
                            aiMove      = true;
                        }
                    }
                }
            }
        }

        if (!aiMove) {
            // Before making random move, force move in own trap and avoid player's traps
            for (let i = 0; i < board.length && !aiMove; i++) {
                for (let j = 0; j < board[i].length && !aiMove; j++) {
                    ccCount = 0;

                    if (board[i][j] === null) {
                        if (i - 1 >= 0) {
                            if (board[i - 1][j] === aiColor) ccCount++;
                        } else {
                            ccCount++;
                        }

                        if (j - 1 >= 0) {
                            if (board[i][j - 1] === aiColor) ccCount++;
                        } else {
                            ccCount++;
                        }

                        if (i + 1 <= 9) {
                            if (board[i + 1][j] === aiColor)  ccCount++;
                        } else {
                            ccCount++;
                        }

                        if (j + 1 <= 9) {
                            if (board[i][j + 1] === aiColor) ccCount++;
                        } else {
                            ccCount++;
                        }

                        if (ccCount === 4) {
                            console.log('Before making random move, force move in own trap and avoid player\'s traps @ ' + [i, j]);
                            board[i][j] = aiColor;
                            aiMove      = true;
                        }
                    }
                }
            }
        }

        // if player has made a move, then make AI make a move at random
        if (!aiMove) {
            let current = false;

            if (countRed > 0 || countBlue > 0) {
                while (!current) {
                    aiC = Math.round(Math.random() * 9);
                    aiR = Math.round(Math.random() * 9);

                    if (board[aiR][aiC] === null) {
                        current = true;
                    }
                }

                board[aiR][aiC] = aiColor;
                console.log('make a move at random @ ' + [aiR, aiC]);
            }
        }

        board = GoGame.updateBoard(board, [this.state.colors.user, this.state.colors.ai]);

        // re-count current number of red and blue squares on the board after check to confirm final count
        scores    = this.scoreCount(board);
        countRed  = scores.red;
        countBlue = scores.blue;

        if (countRed + countBlue >= 100) this.checkForWinner(countRed, countBlue);

        previousMoves     = this.state.previousMoves.moves.slice();
        previousLocations = this.state.previousMoves.locations.slice();
        previousMoves.push(this.state.squares);
        previousLocations.push(' @ (' + (row + 1) + ', ' + (col + 1) + ')');
        this.setState({previousMoves: {locations: previousLocations, moves: previousMoves}, squares: board, scores});
    } // end of runAi function

    makeMove(searchColor, replaceColor, targetCount, board, row, col, takeover = false) {
        let possible    = true;
        let valid       = false;
        let sel         = [];
        let colorCount  = 0;
        let aiMove      = false;
        let color2      = searchColor === 'Red' ? 'Blue' : 'Red';
        
        if (row - 1 >= 0) {
            if (board[row - 1][col] === searchColor) {
                colorCount++;
            } else if (board[row - 1][col] === color2) {
                possible = false;
            } else {
                sel   = [row - 1, col];
                valid = this.checkMove(board, sel, takeover);
            }
        } else {
            colorCount++;
        }

        if (possible) {
            if (col - 1 >= 0) {
                if (board[row][col - 1] === searchColor) {
                    colorCount++;
                } else if (board[row][col - 1] === color2) {
                    possible = false;
                } else if (!valid) {
                    sel   = [row, col - 1];
                    valid = this.checkMove(board, sel, takeover);
                }
            } else {
                colorCount++;
            }
        }

        if (possible) {
            if (row + 1 <= 9) {
                if (board[row + 1][col] === searchColor) {
                    colorCount++;
                } else if (board[row + 1][col] === color2) {
                    possible = false;
                } else if (!valid) {
                    sel   = [row + 1, col];
                    valid = this.checkMove(board, sel, takeover);
                }
            } else {
                colorCount++;
            }
        }

        if (possible){
            if (col + 1 <= 9) {
                if (board[row][col + 1] === searchColor) {
                    colorCount++;
                } else if (board[row][col + 1] === color2) {
                    possible = false;
                } else if (!valid) {
                    sel   = [row, col + 1];
                    valid = this.checkMove(board, sel, takeover);
                }
            } else {
                colorCount++;
            }
        }

        if (possible && colorCount >= targetCount && valid) {
            board[sel[0]][sel[1]] = replaceColor;
            aiMove                = true;
        }
        
        return {board, aiMove, sel: [row, col]}
    }
    
    static updateBoard(board, order = []) {
        let count, currentColor, iterationColor;
        order.push('None');

        // check surroundings to switch surrounded blocks
        for (let k = 0; k < order.length; k++) {
            iterationColor = order[k] === 'None' ? null : order[k];
            for (let i = 0; i < board.length; i++) {
                for (let j = 0; j < board[i].length; j++) {
                    count = 0;

                    if ((iterationColor !== null && board[i][j] !== iterationColor && board[i][j] !== null)
                        || (iterationColor === null && board[i][j] !== null)) {
                        currentColor = iterationColor !== null ? iterationColor : board[i][j];

                        if (i - 1 >= 0) {
                            if (board[i - 1][j] === currentColor) count++;
                        } else {
                            count++;
                        }

                        if (j - 1 >= 0) {
                            if (board[i][j - 1] === currentColor) count++;
                        } else {
                            count++;
                        }

                        if (i + 1 <= 9) {
                            if (board[i + 1][j] === currentColor) count++;
                        } else {
                            count++;
                        }

                        if (j + 1 <= 9) {
                            if (board[i][j + 1] === currentColor) count++;
                        } else {
                            count++;
                        }

                        if (count === 4) board[i][j] = currentColor;
                    }
                }
            }
        }


        return board;
    }

    checkMove(board, sel, takeover) {
        const userColor = this.state.colors.user;
        const aiColor   = this.state.colors.ai;
        let ccCount     = 0;
        let nullCount   = 0;
        let possible    = false;

        if (board[sel[0]][sel[1]] !== null) return false;

        if (sel[0] - 1 >= 0) {
            if (board[sel[0] - 1][sel[1]] === userColor) {
                ccCount++;
            } else if (board[sel[0] - 1][sel[1]] === aiColor) {
                possible = true;
            } else {
                nullCount++;
            }
        } else {
            ccCount++;
        }

        if (!possible) {
            if (sel[1] - 1 >= 0) {
                if (board[sel[0]][sel[1] - 1] === userColor) {
                    ccCount++;
                } else if (board[sel[0]][sel[1] - 1] === aiColor) {
                    possible = true;
                } else {
                    nullCount++;
                }
            } else {
                ccCount++;
            }
        }

        if (!possible) {
            if (sel[0] + 1 <= 9) {
                if (board[sel[0] + 1][sel[1]] === userColor) {
                    ccCount++;
                } else if (board[sel[0] + 1][sel[1]] === aiColor) {
                    possible = true;
                } else {
                    nullCount++;
                }
            } else {
                ccCount++;
            }
        }

        if (!possible) {
            if (sel[1] + 1 <= 9) {
                if (board[sel[0]][sel[1] + 1] === userColor) {
                    ccCount++;
                } else if (board[sel[0]][sel[1] + 1] === aiColor) {
                    possible = true;
                } else {
                    nullCount++;
                }
            } else {
                ccCount++;
            }
        }

        return ((ccCount < 4 && nullCount !== 1) || possible || (ccCount === 3 && nullCount === 1 && takeover));
    }

    // function to clear the board of all played positions and reset playing options
    clear() {
        this.setState({
            squares: Array(10).fill(Array(10).fill(null)),
            previousMoves: {
                locations: [],
                moves: [],
            },
            currentMove: 0,
            scores: {
                red: 0,
                blue: 0,
            },
            redIsNext: true,
            winner: null,
        });
    }

    scoreCount(board) {
        const squares = board ? board : this.state.squares;
        let countRed  = 0;
        let countBlue = 0;

        for (let i = 0; i < squares.length; i++) {
            for (let j = 0; j < squares[i].length; j++) {
                if (squares[i][j] !== null) {
                    if (squares[i][j] === 'Red') {
                        countRed++;
                    } else if (squares[i][j] === 'Blue') {
                        countBlue++;
                    }
                }
            }
        }

        return {red: countRed, blue: countBlue};
    }

    userChecks(board, row, col) {
        const scores    = this.scoreCount(board);
        const countRed  = scores.red;
        const countBlue = scores.blue;

        let previousMoves     = this.state.previousMoves.moves.slice();
        let previousLocations = this.state.previousMoves.locations.slice();
        previousMoves.push(this.state.squares);
        previousLocations.push(' @ (' + (row + 1) + ', ' + (col + 1) + ')');

        this.setState({
            previousMoves: {
                locations: previousLocations,
                moves: previousMoves,
            },
            squares: board,
            scores,
            redIsNext: !this.state.redIsNext
        });

        if (countRed + countBlue >= 100) this.checkForWinner(countRed, countBlue);
    }

    checkForWinner(countRed, countBlue) {
        let winner;

        if (countRed > countBlue) {
            winner = 'Red';
        } else if (countBlue > countRed) {
            winner = 'Blue';
        } else {
            winner = 'Tie';
        }

        this.setState({winner});
    }

    render() {
        const squares = this.state.squares;
        const winner  = this.state.winner;
        let status;

        if (winner) {
            status = <div><b>{winner === 'Tie' ? 'Tied game!' : 'Winner: '}</b>
                {winner !== 'Tie' &&
                <div className='box tiny-box' style={{
                    display: 'inline-block',
                    width: '15%',
                    backgroundColor: winner,
                }}> </div>}
            </div>;
        } else {
            status = <div><b>Next player: </b>
                <div className='box tiny-box' style={{
                    display: 'inline-block',
                    width: '15%',
                    backgroundColor: this.state.redIsNext ? 'Red' : 'Blue'
                }}> </div>
            </div>;
        }

        return (
            <div className="game">
                <div className="game-info">
                    <div style={{display: 'grid', gridTemplateColumns: "33% 33% 33%"}}>
                        <div className='box ' style={{marginBottom: '.5rem'}}>
                            <label htmlFor="versus">Versus: </label>
                            <div className='select is-small' style={{marginBottom: '3px'}}>
                                <select className='dropdown'
                                        style={{borderRadius: '2px', fontSize: '12px', padding: '0px 30px 0px 6px'}}
                                        name="versus" id="versus" onChange={(e) => {
                                    this.setState({versus: e.target.value});
                                    this.clear();
                                }} value={this.state.versus}>
                                    <option value="human">Human</option>
                                    <option value="computer">Computer</option>
                                </select>
                            </div>
                            {this.state.versus === 'computer' &&
                            <div>
                                <label htmlFor="level">Difficulty: </label>
                                <div
                                    className={(this.state.level === 'Hard' ? 'is-danger' : this.state.level === 'Medium' ? 'is-warning' : 'is-success') + ' select is-small'}>
                                    <select name="level" id="level"
                                            style={{borderRadius: '2px', fontSize: '12px', padding: '0px 30px 0px 6px'}}
                                            value={this.state.level} onChange={(e) => {
                                        this.setState({level: e.target.value});
                                        this.clear();
                                    }}>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>}
                        </div>

                        <div className='box' style={{marginBottom: '.5rem'}}>
                            {status}
                            <b>Blue Score: </b>{this.state.scores.blue}
                            <br/>
                            <b>Red Score:</b> {this.state.scores.red}
                        </div>
                        <div style={{marginBottom: '.5rem', marginLeft: '.5rem', textAlign: 'left'}}>
                            <div>
                                <button className="button is-danger" style={{fontSize: '12px'}} onClick={() => this.clear()}>Reset Board</button>
                            </div>
                            <div>
                                <button disabled={this.state.currentMove === 0} style={{fontSize: '12px'}} className="button is-warning"
                                        onClick={() => this.previousMove()}>
                                    Undo {this.state.currentMove === 0 ? '' : this.state.versus === 'computer' ? 'Red' : this.state.redIsNext ? 'Blue' : 'Red'}
                                    {this.state.previousMoves.locations[this.state.currentMove - 1]}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="game-board">
                        <Board
                            squares={squares}
                            onClick={(row, col) => this.handleClick(row, col)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}