const EVEN = 0;
const ODD = 1;
const VISITED = 2;
const KNIGHT = 3;
const VALID_EVEN = 4;
const VALID_ODD = 5;

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
        3: 'knight',
        4: 'valid-even',
        5: 'valid-odd'
    };

    // bind context variable to the current Game() object
    // for each of these global handlers/interval
    const grid = document.querySelector('#grid');

    grid.addEventListener('click', this.onClick.bind(this));

    // set up initial board state
    let state = this.displayStateCopy();

    // generate checkered background
    state = this.checkerFill(state);

    // this ivar will keep track of the knight's current position
    // initially null, as the player must make the first move
    this.knight = null;

    this.score = 0;

    this.render(state);
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
      state[clicked.x][clicked.y] = KNIGHT;

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

      this.score += 1;

      this.render(state);

      return;
    }

    if ([VALID_EVEN, VALID_ODD].includes(state[clicked.x][clicked.y])) {
        // mark the old spot as "visited"
        state[this.knight.x][this.knight.y] = VISITED;

        // move the knight to the new spot
        this.knight = clicked;

        this.score += 1;

        // update display to show new knight position
        state[this.knight.x][this.knight.y] = KNIGHT;

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

        this.render(state);
    }
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
        if (![VISITED, KNIGHT].includes(state[x][y])) {
          won = false;
          break;
        }
      }
    }

    if (won) {
      sona.play('tada');

      alert(`You win! You are the champion!`);
    } else {
      alert(`You lose! Your score was ${this.score}.`);
    }

    this.gameOver = true;
  }
}
