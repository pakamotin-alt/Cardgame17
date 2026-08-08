// They discarded (ran out of lead suit) - also reveals trump
        trumpKnown = true;
        addChat('🔥 "' + players[pIdx].name + '" এর কাছে ' + SUIT_NAMES[leadSuit] + ' নেই! বলে: "Show Your Trump!" ট্রাম্প: ' + SUIT_EMOJIS[trumpSuit] + ' ' + SUIT_NAMES[trumpSuit] + ' (' + players[trumpSelector].name + ' নির্বাচিত)', 'trump-reveal');
      }
    }
  }
}

function getWinningEntry(trick) {
  let best = trick[0];
  for (let i = 1; i < trick.length; i++) {
    let entry = trick[i];
    if (entry.card.suit === trumpSuit && best.card.suit !== trumpSuit) {
      best = entry;
    } else if (entry.card.suit === trumpSuit && best.card.suit === trumpSuit) {
      if (RANK_VALUES[entry.card.rank] > RANK_VALUES[best.card.rank]) best = entry;
    } else if (entry.card.suit === best.card.suit && entry.card.suit !== trumpSuit) {
      if (RANK_VALUES[entry.card.rank] > RANK_VALUES[best.card.rank]) best = entry;
    }
  }
  return best;
}

function advanceTrick() {
  // Next player clockwise
  let nextPlayer = (currentPlayer + 1) % 4;
  
  if (currentTrick.length >= 4) {
    // Trick complete
    setTimeout(() => resolveTrick(), 500);
  } else {
    currentPlayer = nextPlayer;
    updateUI();
    setMessage(players[currentPlayer].name + ' এর পালা...');
    
    if (currentPlayer === 0) {
      enableHandSelection();
    } else {
      setTimeout(() => aiPlayCard(currentPlayer), 600 + Math.random() * 400);
    }
  }
}

function resolveTrick() {
  let winner = getWinningEntry(currentTrick);
  tricksWon[winner.playerIdx]++;
  totalTricksThisRound++;
  
  addChat('✅ ' + players[winner.playerIdx].name + ' ট্রিকটি জিতেছে! (' + winner.card.rank + SUIT_EMOJIS[winner.card.suit] + ')');
  
  currentTrick = [];
  leadSuit = null;
  trickLeader = winner.playerIdx;
  currentPlayer = winner.playerIdx;
  
  updateUI();
  
  // Check end of round
  if (totalTricksThisRound >= 13) {
    setTimeout(() => endRound(), 800);
    return;
  }
  
  // Start next trick
  setMessage(players[currentPlayer].name + ' নতুন ট্রিক শুরু করছে...');
  
  if (currentPlayer === 0) {
    addChat('🎯 আপনি নতুন ট্রিক শুরু করছেন...');
    enableHandSelection();
  } else {
    setTimeout(() => {
      leadSuit = null;
      aiPlayCard(currentPlayer);
    }, 800);
  }
}

// ============ ROUND END ============

function endRound() {
  gamePhase = 'round_end';
  disableHandSelection();
  
  let tricksA = tricksWon[0] + tricksWon[3];
  let tricksB = tricksWon[1] + tricksWon[2];
  let info = getTeamCallInfo();
  
  addChat('━━━━━━━━━━━━━━━━━━━━');
  addChat('📊 রাউন্ড শেষ!');
  addChat('🔵 টিম A ট্রিক: ' + tricksA + ' / লক্ষ্য: ' + info.callA);
  addChat('🔴 টিম B ট্রিক: ' + tricksB + ' / লক্ষ্য: ' + info.callB);
  
  // Scoring
  let pointsA = 0, pointsB = 0;
  
  // Team A scoring
  if (tricksA >= info.callA) {
    pointsA = info.callA;
    addChat('✅ টিম A তাদের কল পূরণ করেছে! +' + info.callA);
  } else {
    pointsA = -info.callA;
    addChat('❌ টিম A কল পূরণ করতে পারেনি! -' + info.callA);
  }
  
  // Team B scoring
  if (tricksB >= info.callB) {
    pointsB = info.callB;
    addChat('✅ টিম B তাদের কল পূরণ করেছে! +' + info.callB);
  } else {
    pointsB = -info.callB;
    addChat('❌ টিম B কল পূরণ করতে পারেনি! -' + info.callB);
  }
  
  // Bonus
  if (bonusDeclared) {
    let bonusTeam = getTeam(bonusPlayer);
    if (bonusTeam === 'A') {
      if (tricksA >= info.callA) {
        pointsA += 13;
        addChat('⭐ টিম A বোনাস পূরণ! +13');
      } else {
        pointsA -= 10;
        addChat('💔 টিম A বোনাস ব্যর্থ! -10');
      }
    } else {
      if (tricksB >= info.callB) {
        pointsB += 13;
        addChat('⭐ টিম B বোনাস পূরণ! +13');
      } else {
        pointsB -= 10;
        addChat('💔 টিম B বোনাস ব্যর্থ! -10');
      }
    }
  }
  
  teamAPoints += pointsA;
  teamBPoints += pointsB;
  
  if (teamAPoints < 0) teamAPoints = 0;
  if (teamBPoints < 0) teamBPoints = 0;
  
  addChat('━━━━━━━━━━━━━━━━━━━━');
  addChat('📈 স্কোর: 🔵 Team A = ' + teamAPoints + ' | 🔴 Team B = ' + teamBPoints);
  
  updateUI();
  
  // Check win
  if (teamAPoints >= 50) {
    showWinner('A');
  } else if (teamBPoints >= 50) {
    showWinner('B');
  } else {
    setMessage('পরবর্তী রাউন্ডের জন্য "নতুন গেম" বাটনে ক্লিক করুন');
    addChat('🔄 পরবর্তী রাউন্ড শুরু করতে "নতুন গেম" ক্লিক করুন।');
  }
}

function showWinner(team) {
  gamePhase = 'game_over';
  let banner = document.getElementById('winner-banner');
  let text = document.getElementById('winner-text');
  let detail = document.getElementById('winner-detail');
  let trophy = document.getElementById('trophy-icon');
  
  banner.classList.add('show');
  trophy.textContent = '🏆';
  
  if (team === 'A') {
    text.textContent = 'টিম A বিজয়ী! 🎉';
    detail.textContent = 'আপনি (😎) + AI করিম (🤖) জিতেছেন! স্কোর: ' + teamAPoints + ' - ' + teamBPoints;
  } else {
    text.textContent = 'টিম B বিজয়ী! 🎉';
    detail.textContent = 'AI সেলিম + AI রহিম জিতেছে! স্কোর: ' + teamBPoints + ' - ' + teamAPoints;
  }
}

// ============ INIT ============

setMessage('"নতুন গেম" বাটনে ক্লিক করে খেলা শুরু করুন!');
updateUI();
