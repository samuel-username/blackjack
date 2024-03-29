
const table = document.querySelector('#blackjack-table'),
      hitBtn = document.querySelector('#hit'),
      dealBtn = document.querySelector('#deal'),
      standBtn = document.querySelector('#stand'),
      playerSpace = document.querySelector('.player-space'),
      pendingSpace = document.querySelector('.pending-space'),
      botSpace = document.querySelector('.bot-space'),
      playerCardValueDisplay = document.querySelector('#playerScore'),
      botCardValueDisplay = document.querySelector('#computerScore'),
      messageScreen = document.querySelector('.message-screen'),
      audio = {
        cardSwipe: new Audio('audio/card_swipe.mp3'),
      };

let storedGameData = JSON.parse(localStorage.getItem('game-data'))


let playerCardValue = 0, 
    botCardValue = 0,
    playerScore = 0,
    botScore = 0,
    draws = 0,
    isOver = false,
    allCards = [];
    

if (localStorage && !storedGameData) {
  let gameData = {
    playerScore,
    botScore, 
    draws
  }
  localStorage.setItem('game-data', JSON.stringify(gameData))
} else if (storedGameData) {
  playerScore = storedGameData.playerScore
  botScore = storedGameData.botScore
  draws = storedGameData.draws
}

const random = (min, max) => Math.floor(Math.random() * (max - min)) + min,
      delay = ms => new Promise(res => setTimeout(res, ms)),
      enable = button => button.disabled = false,
      disable = button => button.disabled = true,
      cardId = { 
        A: [1, 11], 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
        7: 7, 8: 8, 9: 9, 10: 10, J: 10, K: 10, Q: 10
      },
      cardTypes = Object.keys(cardId),
      shapes = ['club', 'diamond', 'heart', 'spade'];

function createCard() {
  let card, front, back, shape, cardType;
  
  shape = shapes[random(0, shapes.length)]
  cardType = cardTypes[random(0, cardTypes.length)]
  front = document.createElement('img')
  front.classList.add('front')
  front.src = `images/card front/${shape}/${cardType}.jpg`
  front.alt = 'front'
  
  back = document.createElement('img')
  back.classList.add('back')
  back.src = 'images/card back/back3.jpg'
  back.alt = 'back'
  
  card = document.createElement('div')
  card.classList.add('card')
  card.dataset.value = cardType === 'A' ? 
    cardId.A[random(0, 2)] :
    cardId[cardType];
  card.append(front, back)
  
  allCards.push(card)
  return card
}

async function addCard(parent) {
  let card = createCard()
  
  // first put the card in the table center
  pendingSpace.appendChild(card)
  card.classList.add('pending-card')
  if (parent.dataset.info) {
    disable(hitBtn)
    disable(standBtn)
  }
  await delay(500)
  card.remove()
  card.style.animationDuration = '0s'
  card.classList.remove('pending-card')
  
  // then put it in the current player's side of the table
  if (parent.dataset.info) {
    parent.appendChild(card)
    enable(hitBtn)
    enable(standBtn)
  } else {
    parent.prepend(card)
  }
  countCardValues(card.dataset.value, parent.dataset.info)
}

function countCardValues(value, isPlayerTurn) {
  if (isPlayerTurn) {
    if (playerCardValue <= 21) {
      playerCardValue += Number(value)
      playerCardValueDisplay.textContent = playerCardValue
    }
  } else {
    if (botCardValue <= 21) {
      botCardValue += Number(value)
      botCardValueDisplay.textContent = botCardValue
    }
  }
}

hitBtn.addEventListener('click', hit)
standBtn.addEventListener('click', stand)
dealBtn.addEventListener('click', deal)

async function hit() {
  playAudio(audio.cardSwipe)

  await addCard(playerSpace)
  enable(standBtn)
  determineWinner()
}

async function stand() {
  disable(hitBtn)
  disable(standBtn)
  
  while (botCardValue <= 15 && !isOver) {
    await delay(random(0, 2000))
    playAudio(audio.cardSwipe)
    
    await addCard(botSpace)
    determineWinner()
  }
}

function deal() {
  disable(standBtn)
  enable(hitBtn)
  playerCardValue = 0
  botCardValue = 0
  removeCards()
  
  playerCardValueDisplay.textContent = 0
  botCardValueDisplay.textContent = 0
  isOver = false
  showBtns()
}

function playAudio(sound) {
  if (!sound.paused) {
    sound.pause()
    sound.currentTime = 0
  }
  sound.play()
}

function determineWinner() {
  if (
    (playerCardValue <= 21 &&
    playerCardValue > botCardValue &&
    botCardValue > 15) || botCardValue > 21
    ) {
    playerScore++
    disable(hitBtn)
    displayMessageScreen('you win', 'var(--tableColor)', true)
  } else if (playerCardValue > 21) {
    botScore++
    disable(hitBtn)
    disable(standBtn)
    displayMessageScreen('bust', 'red', true)
  } else if (botCardValue > playerCardValue) {
    botScore++
    displayMessageScreen('you lose', 'red', true)
  } else if (playerCardValue === botCardValue && botCardValue >= 16) {
    draws++
    displayMessageScreen('draw', 'black', true)
  }
  
  if (storedGameData) {
    let gameData = {
      playerScore,
      botScore, 
      draws
    }
    localStorage.setItem('game-data', JSON.stringify(gameData))
  }
}

function removeCards() {
  allCards.forEach(card => card.remove())
  allCards = []
}

function displayMessageScreen(message, color, gameOver) {
  isOver = gameOver
  const messageScreenContent = `
    <h1 class='message' style='color: ${color}'>${message}</h1>
    <table class='scores'>
      <tr>
        <th>Wins</th>
        <th>Losses</th>
        <th>Draws</th>
      </tr>
      <tr>
        <td>${playerScore}</td>
        <td>${botScore}</td>
        <td>${draws}</td>
      </tr>
    </table>
    <button type='button' onclick='hideMessageScreen()'>Continue</button>
    `;
  messageScreen.innerHTML = messageScreenContent
  messageScreen.classList.add('visible')
}

function hideMessageScreen() {
  messageScreen.classList.remove('visible')
  if (isOver) {
    enable(dealBtn)
    hideBtns()
  }
}

function hideBtns() {
  dealBtn.style.display = 'block'
  standBtn.style.display = 'none'
  hitBtn.style.display = 'none'
}

function showBtns() {
  dealBtn.style.display = 'none'
  standBtn.style.display = 'block'
  hitBtn.style.display = 'block'
}
showBtns()

document.getElementById('ms-toggle').addEventListener('click', () => {
  displayMessageScreen('game ongoing', 'black', false)
});
