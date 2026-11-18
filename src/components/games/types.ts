export type PlayerIndex = 0 | 1;
export type Player = { name: string; color: string };

/** Every minigame gets the two players and reports the winner once it's decided (ties replay inside the game). */
export type GameProps = { players: [Player, Player]; onWinner: (winner: PlayerIndex) => void };

export type GameId = 'tictactoe' | 'dice' | 'card' | 'rps' | 'coin';

export const GAMES: { id: GameId; name: string; emoji: string; blurb: string; pro: boolean }[] = [
  { id: 'tictactoe', name: 'Tic-Tac-Toe', emoji: '❌⭕', blurb: 'Three in a row takes it.', pro: false },
  { id: 'dice', name: 'Dice Duel', emoji: '🎲', blurb: 'Roll two dice. Highest total wins.', pro: false },
  { id: 'card', name: 'High Card', emoji: '🃏', blurb: 'Draw a card. Highest card wins (aces high).', pro: false },
  { id: 'rps', name: 'Rock-Paper-Scissors', emoji: '✊✋✌️', blurb: 'Pick in secret, reveal together.', pro: true },
  { id: 'coin', name: 'Coin Flip', emoji: '🪙', blurb: 'Call it in the air. Right call wins.', pro: true },
];

/** How long a game shows its final result before handing the win over. */
export const RESULT_PAUSE_MS = 1400;
