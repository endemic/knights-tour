const EVEN = 0;
const ODD = 1;
const VISITED = 2;
const KNIGHT_EVEN = 3;
const KNIGHT_ODD = 4;
const VALID_EVEN = 5;
const VALID_ODD = 6;

class Game extends Grid {
  constructor() {
    const rows = 8;
    const columns = 8;

    super(rows, columns);

    // our grid contains simple integers to represent game objects;
    // this map translates the numbers to a string, that can then be used as
    // human-readable reference or CSS class (for display purposes)
    this.cssClassMap = {
        0: 'even',
        1: 'odd',
        2: 'visited',
        3: 'knight-even',
        4: 'knight-odd',
        5: 'valid-even',
        6: 'valid-odd'
    };

    // bind context variable to the current Game() object
    // for each of these global handlers/interval
    const grid = document.querySelector('#grid');

    grid.addEventListener('click', this.onClick.bind(this));

    const reset = document.querySelector('#reset');
    reset.addEventListener('click', this.reset.bind(this));

    this.reset();
  }

  checkerFill(grid) {
    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.columns; x += 1) {
        if ([null, VALID_EVEN, VALID_ODD].includes(grid[x][y])) {
          grid[x][y] = (x + y) % 2;
        }
      }
    }

    return grid;
  }

  reset() {
    // set up initial board state
    let state = this.fill(this.displayStateCopy(), null);

    // generate checkered background
    state = this.checkerFill(state);

    this.gameOver = false;

    // this ivar will keep track of the knight's current position
    // initially null, as the player must make the first move
    this.knight = null;

    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('knight:highScore'), 10) || 0;

    this.renderScore();

    this.render(state);
  }

  onClick(event) {
    if (this.gameOver) {
      return;
    }

    const clicked = {
        x: parseInt(event.target.dataset.x, 10),
        y: parseInt(event.target.dataset.y, 10)
    };

    let state = this.displayStateCopy();

    // handle condition for first move -- you can start anywhere
    if (!this.knight) {
      // display white/black knight based on color of clicked square
      if (state[clicked.x][clicked.y] === EVEN) {
        state[clicked.x][clicked.y] = KNIGHT_EVEN;
      } else {
        state[clicked.x][clicked.y] = KNIGHT_ODD;
      }

      // set the knight's initial position
      this.knight = clicked;

      // highlight next valid moves -- TODO extract this to its own function
      let validMoves = this.getValidMoves(this.knight.x, this.knight.y)
                           .filter(({x, y}) => [EVEN, ODD].includes(state[x][y]));

      validMoves.forEach(({x, y}) => {
        if (state[x][y] === EVEN) {
          state[x][y] = VALID_EVEN;
        } else {
          state[x][y] = VALID_ODD;
        }
      });

      sona.play('click');

      this.score += 1;

      this.renderScore();

      this.render(state);

      return;
    }

    if ([VALID_EVEN, VALID_ODD].includes(state[clicked.x][clicked.y])) {
        // mark the old spot as "visited"
        state[this.knight.x][this.knight.y] = VISITED;

        // move the knight to the new spot
        this.knight = clicked;

        // display white/black knight based on color of clicked square
        if (state[this.knight.x][this.knight.y] === VALID_EVEN) {
          state[this.knight.x][this.knight.y] = KNIGHT_EVEN;
        } else {
          state[this.knight.x][this.knight.y] = KNIGHT_ODD;
        }

        // re-draw the board background so as to erase the previously-drawn valid moves
        state = this.checkerFill(state);

        // highlight the next valid moves -- TODO extract this to its own function
        let validMoves = this.getValidMoves(this.knight.x, this.knight.y)
                           .filter(({x, y}) => [EVEN, ODD].includes(state[x][y]));

        // game soft locks if validMoves.length === 0 (e.g. you can't click anywhere)
        // `checkWinCondition` handles updating UI, etc.
        if (validMoves.length === 0) {
          this.checkWinCondition();
        }

        validMoves.forEach(({x, y}) => {
          if (state[x][y] === EVEN) {
            state[x][y] = VALID_EVEN;
          } else {
            state[x][y] = VALID_ODD;
          }
        });

        sona.play('click');

        this.score += 1;

        this.renderScore();

        this.render(state);
    }
  }

  renderScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('knight:highScore', this.highScore);
    }

    document.querySelector('#score').textContent = this.score;
    document.querySelector('#high_score').textContent = this.highScore;
  }

  getValidMoves(x, y) {
    // function to ensure that (x, y) coords are within our data structure
    const withinBounds = ({ x, y }) => x >= 0 && x < this.columns && y >= 0 && y < this.rows;

    return [
        // above
        { x: x - 1, y: y - 2},
        { x: x + 1, y: y - 2},

        // left
        { x: x - 2, y: y - 1},
        { x: x - 2, y: y + 1},

        // right
        { x: x + 2, y: y - 1},
        { x: x + 2, y: y + 1},

        // below
        { x: x - 1, y: y + 2},
        { x: x + 1, y: y + 2},
    ].filter(withinBounds);
  }

  checkWinCondition() {
    let won = true;
    let state = this.displayStateCopy();

    // check if all squares in the grid are `VISITED` (last square will be the knight)
    for (let x = 0; x < this.columns; x += 1) {
      for (let y = 0; y < this.rows; y += 1) {
        if (![VISITED, KNIGHT_EVEN, KNIGHT_ODD].includes(state[x][y])) {
          won = false;
          break;
        }
      }
    }

    if (won) {
      sona.play('tada');
    } else {
      sona.play('stop');
    }

    this.gameOver = true;
  }
}
