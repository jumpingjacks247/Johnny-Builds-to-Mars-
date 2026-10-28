(() => {
  const pageStage = document.querySelector('.page-stage');
  const cover = document.querySelector('.book-intro');
  if (cover && pageStage) {
    cover.classList.add('story-page', 'cover-page', 'active');
    cover.dataset.page = '0';
    cover.setAttribute('aria-hidden', 'false');
    pageStage.prepend(cover);
    document.querySelectorAll('.story-page:not(.cover-page)').forEach((page) => page.classList.remove('active'));
  }
  const pages = [...document.querySelectorAll('.story-page')];
  const dots = [...document.querySelectorAll('.page-dot')];
  const prevButton = document.querySelector('#prevButton');
  const nextButton = document.querySelector('#nextButton');
  const pagePill = document.querySelector('#pagePill');
  const progressFill = document.querySelector('#progressFill');
  const story = document.querySelector('#story');
  const livingRoom = document.querySelector('#livingRoom');
  const johnnyBubble = document.querySelector('#johnnyBubble');
  const maxBubble = document.querySelector('#maxBubble');
  const thoughtBubble = document.querySelector('#thoughtBubble');
  const challengeFeedback = document.querySelector('#challengeFeedback');
  const toast = document.querySelector('#toast');
  if (livingRoom && thoughtBubble) livingRoom.appendChild(thoughtBubble);
  let currentPage = 0;
  let isTurning = false;
  let speechEnabled = false;
  let toastTimer;
  const pageComplete = { 0: true, 1: false, 2: false, 3: false, 4: false, 5: true };
  let pageOneExpressionComplete = false;
  let pageOneDrawingComplete = false;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  function refreshNavigationState() {
    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage === 5;
    const locked = currentPage > 0 && !pageComplete[currentPage];
    nextButton.classList.toggle('locked', locked);
    nextButton.title = locked ? 'Complete this page before turning it.' : '';
  }

  function canTurnForward(destination) {
    if (destination <= currentPage) return true;
    for (let requiredPage = currentPage; requiredPage < destination; requiredPage += 1) {
      if (pageComplete[requiredPage]) continue;
      const messages = {
        1: 'Choose eye-roll and draw your rocket idea first.',
        2: 'Pack all four rocket parts into the cardboard box first.',
        3: 'Draw your rocket on the blueprint before turning the page.',
        4: 'Press the button four times to blast off first.'
      };
      showToast(messages[requiredPage] || 'Complete this page before turning it.');
      return false;
    }
    return true;
  }

  function updatePageOneCompletion() {
    const wasComplete = pageComplete[1];
    pageComplete[1] = pageOneExpressionComplete && pageOneDrawingComplete;
    if (!pageComplete[1]) {
      pageComplete[2] = false;
      pageComplete[3] = false;
      pageComplete[4] = false;
    }
    refreshNavigationState();
    if (pageComplete[1] && !wasComplete) showToast('Page 1 complete! You can turn the page.');
  }

  function setPage(pageNumber, shouldScroll = true, turnDirection = null) {
    const nextPage = Math.max(0, Math.min(5, pageNumber));
    if (isTurning) return;
    if (nextPage > currentPage && !canTurnForward(nextPage)) return;
    if (nextPage === currentPage) {
      document.body.classList.toggle('inside-book', currentPage !== 0);
      pages.forEach((page) => page.setAttribute('aria-hidden', String(Number(page.dataset.page) !== currentPage)));
      dots.forEach((dot) => dot.classList.toggle('active', Number(dot.dataset.goto) === currentPage));
      pagePill.textContent = currentPage === 0 ? 'FRONT COVER' : `PAGE ${currentPage} OF 5`;
      progressFill.style.width = currentPage === 0 ? '0%' : `${currentPage * 20}%`;
      refreshNavigationState();
      if (shouldScroll) story.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const resolvedDirection = turnDirection || (nextPage > currentPage ? 'forward' : 'back');
    const outgoingPage = pages.find((page) => Number(page.dataset.page) === currentPage);
    const incomingPage = pages.find((page) => Number(page.dataset.page) === nextPage);
    isTurning = true;
    pageStage.style.height = `${outgoingPage.getBoundingClientRect().height}px`;
    pageStage.classList.add('is-turning');
    pages.forEach((page) => page.classList.remove('active', 'is-turning-page', 'page-out-forward', 'page-in-forward', 'page-out-back', 'page-in-back'));
    outgoingPage.classList.add('active', 'is-turning-page', `page-out-${resolvedDirection}`);
    incomingPage.classList.add('active', 'is-turning-page', `page-in-${resolvedDirection}`);
    currentPage = nextPage;
    document.body.classList.toggle('inside-book', currentPage !== 0);
    pages.forEach((page) => page.setAttribute('aria-hidden', String(Number(page.dataset.page) !== currentPage)));
    dots.forEach((dot) => dot.classList.toggle('active', Number(dot.dataset.goto) === currentPage));
    pagePill.textContent = currentPage === 0 ? 'FRONT COVER' : `PAGE ${currentPage} OF 5`;
    progressFill.style.width = currentPage === 0 ? '0%' : `${currentPage * 20}%`;
    refreshNavigationState();
    if (shouldScroll) story.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      outgoingPage.classList.remove('active', 'is-turning-page', `page-out-${resolvedDirection}`);
      incomingPage.classList.remove('is-turning-page', `page-in-${resolvedDirection}`);
      incomingPage.classList.add('active');
      pageStage.classList.remove('is-turning');
      pageStage.style.height = '';
      isTurning = false;
    }, 780);
  }

  prevButton.addEventListener('click', () => setPage(currentPage - 1, true, 'back'));
  nextButton.addEventListener('click', () => setPage(currentPage + 1, true, 'forward'));
  dots.forEach((dot) => dot.addEventListener('click', () => {
    const destination = Number(dot.dataset.goto);
    setPage(destination, true, destination > currentPage ? 'forward' : 'back');
  }));
  document.querySelector('#startButton').addEventListener('click', () => {
    setPage(1);
    showToast('Let’s find Johnny’s big idea!');
    setTimeout(() => document.querySelector('#expressionChallenge').scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);
  });

  function speak(text, voiceType = 'narrator') {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceType === 'johnny' ? 1.05 : voiceType === 'max' ? .9 : .98;
    utterance.pitch = voiceType === 'johnny' ? 1.3 : voiceType === 'max' ? .72 : 1;
    utterance.volume = .85;
    window.speechSynthesis.speak(utterance);
  }

  function showBubble(element, text, voiceType) {
    element.innerHTML = text;
    element.classList.add('show');
    speak(text.replace(/<[^>]*>/g, ''), voiceType);
  }

  function narratePage() {
    if (!('speechSynthesis' in window)) {
      showToast('Your browser does not support read aloud yet.');
      return;
    }
    speechEnabled = true;
    document.querySelector('#soundToggle').setAttribute('aria-pressed', 'true');
    const lines = [...document.querySelectorAll('#narrativeText p')];
    let index = 0;
    window.speechSynthesis.cancel();
    lines.forEach((line) => line.classList.remove('speaking'));
    const nextLine = () => {
      if (index >= lines.length) return;
      const line = lines[index++];
      line.classList.add('speaking');
      const utterance = new SpeechSynthesisUtterance(line.textContent);
      const voiceType = line.dataset.voice;
      utterance.rate = voiceType === 'johnny' ? 1.05 : voiceType === 'max' ? .9 : .98;
      utterance.pitch = voiceType === 'johnny' ? 1.3 : voiceType === 'max' ? .72 : 1;
      utterance.onend = () => { line.classList.remove('speaking'); setTimeout(nextLine, 160); };
      window.speechSynthesis.speak(utterance);
    };
    nextLine();
    showToast('Story voice is on — listen for Johnny, Max, and the narrator.');
  }

  document.querySelector('#listenButton').addEventListener('click', narratePage);
  document.querySelector('#soundToggle').addEventListener('click', () => {
    speechEnabled = !speechEnabled;
    document.querySelector('#soundToggle').setAttribute('aria-pressed', String(speechEnabled));
    if (!speechEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    showToast(speechEnabled ? 'Read aloud is on.' : 'Read aloud is off.');
  });

  document.querySelectorAll('.expression-card').forEach((card) => {
    card.addEventListener('click', () => {
      const expression = card.dataset.expression;
      document.querySelectorAll('.expression-card').forEach((item) => item.classList.remove('selected', 'correct'));
      card.classList.add('selected');
      if (expression === 'eye-roll') {
        pageOneExpressionComplete = true;
        updatePageOneCompletion();
        card.classList.add('correct');
        challengeFeedback.textContent = 'YES! Bored looks like an eye roll!';
        challengeFeedback.className = 'challenge-feedback good';
        livingRoom.classList.add('bored');
        const burst = document.createElement('div');
        burst.className = 'explosion';
        burst.textContent = 'POOF! ✦';
        livingRoom.appendChild(burst);
        setTimeout(() => burst.remove(), 700);
        showBubble(johnnyBubble, 'What if I built a rocket to <b>MARS?!</b>', 'johnny');
        setTimeout(() => {
          livingRoom.classList.add('max-arrived');
          showBubble(maxBubble, 'Good idea, Johnny! But what do we even <b>NEED?</b>', 'max');
          setTimeout(() => {
            livingRoom.classList.add('thinking');
            document.querySelector('#sceneCaption').textContent = 'Hmm... let’s think!';
            setTimeout(() => {
              thoughtBubble.classList.add('open');
              livingRoom.classList.add('bubble-open');
              document.querySelector('#ideaPrompt').classList.add('hide');
              showToast('Brainstorm time! Draw inside the bubble.');
            }, 850);
          }, 900);
        }, 700);
      } else {
        pageOneExpressionComplete = false;
        updatePageOneCompletion();
        challengeFeedback.textContent = 'Not quite — Johnny is bored, not ' + expression + '!';
        challengeFeedback.className = 'challenge-feedback nope';
        livingRoom.classList.remove('bored');
        showToast('Try another expression card.');
      }
    });
  });

  const rocketBox = document.querySelector('#rocketBox');
  const rocketParts = [...document.querySelectorAll('.rocket-part')];
  const dropSlots = [...document.querySelectorAll('.drop-slot')];
  const buildFeedback = document.querySelector('#buildFeedback');
  const buildSuccess = document.querySelector('#buildSuccess');
  const resetBuild = document.querySelector('#resetBuild');
  const placedParts = new Set();
  let pointerDrag = null;
  let dragGhost = null;
  const partNames = { body: 'Body', point: 'Point', blaster: 'Blaster', wings: 'Wings' };

  function moveDragGhost(event) {
    if (!dragGhost) return;
    dragGhost.style.left = `${event.clientX - 66}px`;
    dragGhost.style.top = `${event.clientY - 38}px`;
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    rocketBox.classList.toggle('drag-over', Boolean(hit && hit.closest('#rocketBox')));
  }

  function clearDrag() {
    if (pointerDrag) pointerDrag.part.classList.remove('dragging');
    if (dragGhost) dragGhost.remove();
    dragGhost = null;
    pointerDrag = null;
    rocketBox.classList.remove('drag-over');
  }

  function placeRocketPart(part) {
    if (!part || placedParts.has(part.dataset.part)) return;
    const slot = dropSlots.find((item) => item.dataset.slot === part.dataset.part);
    if (!slot) return;
    placedParts.add(part.dataset.part);
    part.classList.add('placed');
    part.disabled = true;
    slot.classList.add('filled');
    slot.querySelector('em').textContent = 'packed!';
    buildFeedback.innerHTML = `<span>✦</span> ${partNames[part.dataset.part]} packed in! ${placedParts.size} of 4 pieces ready.`;
    buildFeedback.classList.remove('good');
    if (placedParts.size === 4) {
      pageComplete[2] = true;
      refreshNavigationState();
      buildFeedback.innerHTML = '<span>✦</span> Every piece is ready for lift-off!';
      buildFeedback.classList.add('good');
      buildSuccess.classList.add('show');
      showToast('Rocket kit complete!');
    }
  }

  function finishPointerDrag(event) {
    if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) return;
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    if (hit && hit.closest('#rocketBox')) placeRocketPart(pointerDrag.part);
    clearDrag();
  }

  rocketParts.forEach((part) => {
    part.addEventListener('pointerdown', (event) => {
      if (part.disabled) return;
      event.preventDefault();
      pointerDrag = { part, pointerId: event.pointerId };
      part.classList.add('dragging');
      dragGhost = part.cloneNode(true);
      dragGhost.classList.add('drag-ghost');
      dragGhost.removeAttribute('id');
      document.body.appendChild(dragGhost);
      part.setPointerCapture(event.pointerId);
      moveDragGhost(event);
    });
    part.addEventListener('pointermove', (event) => { if (pointerDrag?.part === part) moveDragGhost(event); });
    part.addEventListener('pointerup', finishPointerDrag);
    part.addEventListener('pointercancel', clearDrag);
    part.addEventListener('dragstart', (event) => {
      pointerDrag = { part, pointerId: null };
      event.dataTransfer.effectAllowed = 'move';
      part.classList.add('dragging');
    });
    part.addEventListener('dragend', clearDrag);
  });

  rocketBox.addEventListener('dragover', (event) => { event.preventDefault(); rocketBox.classList.add('drag-over'); });
  rocketBox.addEventListener('dragleave', () => rocketBox.classList.remove('drag-over'));
  rocketBox.addEventListener('drop', (event) => { event.preventDefault(); if (pointerDrag) placeRocketPart(pointerDrag.part); clearDrag(); });
  resetBuild.addEventListener('click', () => {
    placedParts.clear();
    pageComplete[2] = false;
    pageComplete[3] = false;
    pageComplete[4] = false;
    rocketParts.forEach((part) => { part.classList.remove('placed'); part.disabled = false; });
    dropSlots.forEach((slot) => { slot.classList.remove('filled'); slot.querySelector('em').textContent = 'drop here'; });
    buildSuccess.classList.remove('show');
    buildFeedback.className = 'build-feedback';
    buildFeedback.innerHTML = '<span>✦</span> Drag each piece into the cardboard box.';
    refreshNavigationState();
  });

  const blueprintCanvas = document.querySelector('#blueprintCanvas');
  const blueprintContext = blueprintCanvas.getContext('2d');
  const launchDrawingCanvas = document.querySelector('#launchDrawingCanvas');
  const launchDrawingContext = launchDrawingCanvas.getContext('2d');
  const blueprintFeedback = document.querySelector('#blueprintFeedback');
  const resetBlueprint = document.querySelector('#resetBlueprint');
  const colorSwatches = [...document.querySelectorAll('.color-swatch')];
  const brushSizes = [...document.querySelectorAll('.brush-size')];
  let blueprintColor = '#302b5c';
  let blueprintBrushSize = 5;
  let blueprintDrawing = false;
  let blueprintLastPoint = null;
  let blueprintStrokeCount = 0;

  function blueprintPointFromEvent(event) {
    const rect = blueprintCanvas.getBoundingClientRect();
    const source = event.touches ? event.touches[0] : event;
    return { x: (source.clientX - rect.left) * blueprintCanvas.width / rect.width, y: (source.clientY - rect.top) * blueprintCanvas.height / rect.height };
  }

  function syncLaunchDrawing() {
    launchDrawingContext.clearRect(0, 0, launchDrawingCanvas.width, launchDrawingCanvas.height);
    launchDrawingContext.drawImage(blueprintCanvas, 0, 0, launchDrawingCanvas.width, launchDrawingCanvas.height);
  }

  function beginBlueprintDrawing(event) {
    event.preventDefault();
    blueprintDrawing = true;
    blueprintLastPoint = blueprintPointFromEvent(event);
    blueprintStrokeCount += 1;
    if (blueprintStrokeCount === 1) {
      pageComplete[3] = true;
      refreshNavigationState();
      blueprintFeedback.innerHTML = '<span>✦</span> Keep going! Make your rocket as wild as you like.';
      blueprintFeedback.classList.add('good');
    }
    blueprintCanvas.setPointerCapture?.(event.pointerId);
  }

  function drawBlueprint(event) {
    if (!blueprintDrawing) return;
    event.preventDefault();
    const point = blueprintPointFromEvent(event);
    blueprintContext.beginPath();
    blueprintContext.moveTo(blueprintLastPoint.x, blueprintLastPoint.y);
    blueprintContext.lineTo(point.x, point.y);
    blueprintContext.strokeStyle = blueprintColor;
    blueprintContext.lineWidth = blueprintBrushSize;
    blueprintContext.lineCap = 'round';
    blueprintContext.lineJoin = 'round';
    blueprintContext.stroke();
    blueprintLastPoint = point;
    syncLaunchDrawing();
  }

  function endBlueprintDrawing() {
    blueprintDrawing = false;
    blueprintLastPoint = null;
  }

  colorSwatches.forEach((swatch) => swatch.addEventListener('click', () => {
    blueprintColor = swatch.dataset.color;
    colorSwatches.forEach((item) => item.classList.toggle('active', item === swatch));
  }));
  brushSizes.forEach((brush) => brush.addEventListener('click', () => {
    blueprintBrushSize = Number(brush.dataset.size);
    brushSizes.forEach((item) => item.classList.toggle('active', item === brush));
  }));
  blueprintCanvas.addEventListener('pointerdown', beginBlueprintDrawing);
  blueprintCanvas.addEventListener('pointermove', drawBlueprint);
  blueprintCanvas.addEventListener('pointerup', endBlueprintDrawing);
  blueprintCanvas.addEventListener('pointerleave', endBlueprintDrawing);
  blueprintCanvas.addEventListener('pointercancel', endBlueprintDrawing);
  resetBlueprint.addEventListener('click', () => {
    blueprintContext.clearRect(0, 0, blueprintCanvas.width, blueprintCanvas.height);
    launchDrawingContext.clearRect(0, 0, launchDrawingCanvas.width, launchDrawingCanvas.height);
    blueprintStrokeCount = 0;
    pageComplete[3] = false;
    pageComplete[4] = false;
    pushCount = 0;
    launched = false;
    blastoffScene.classList.remove('blastoff');
    launchRocket.classList.remove('jolt');
    pushButton.disabled = false;
    pushButton.innerHTML = 'PUSH! <span>✦</span>';
    updatePushMeter();
    blueprintFeedback.className = 'blueprint-feedback';
    blueprintFeedback.innerHTML = '<span>✦</span> Start drawing your rocket on the blueprint.';
    refreshNavigationState();
  });
  syncLaunchDrawing();

  const blastoffScene = document.querySelector('#blastoffScene');
  const launchRocket = document.querySelector('#launchRocket');
  const pushButton = document.querySelector('#pushButton');
  const pushDots = [...document.querySelectorAll('.push-dot')];
  const pushCountLabel = document.querySelector('#pushCount');
  let pushCount = 0;
  let launched = false;

  function updatePushMeter() {
    pushDots.forEach((dot, index) => dot.classList.toggle('filled', index < pushCount));
    pushCountLabel.textContent = `${pushCount} / 4`;
  }

  pushButton.addEventListener('click', () => {
    if (launched) return;
    pushCount += 1;
    updatePushMeter();
    launchRocket.classList.remove('jolt');
    void launchRocket.offsetWidth;
    launchRocket.classList.add('jolt');
    window.setTimeout(() => launchRocket.classList.remove('jolt'), 380);
    if (pushCount === 4) {
      launched = true;
      pageComplete[4] = true;
      refreshNavigationState();
      blastoffScene.classList.add('blastoff');
      pushButton.disabled = true;
      pushButton.innerHTML = 'BLASTED! <span>✦</span>';
      showToast('BLASTOFF! Johnny and Max are off to Mars!');
    } else {
      showToast(`${4 - pushCount} more push${4 - pushCount === 1 ? '' : 'es'} to BLASTOFF!`);
    }
  });

  const digSites = [...document.querySelectorAll('.dig-site')];
  const treasureDots = [...document.querySelectorAll('.treasure-dot')];
  const treasureCountLabel = document.querySelector('#treasureCount');
  const marsLandingScene = document.querySelector('#marsLandingScene');
  const endingPanel = document.querySelector('#endingPanel');
  const restartButton = document.querySelector('#restartButton');
  let foundTreasures = 0;
  digSites.forEach((site) => {
    site.addEventListener('click', () => {
      if (site.classList.contains('dug')) return;
      site.classList.add('dug');
      foundTreasures += 1;
      treasureDots.forEach((dot, index) => dot.classList.toggle('found', index < foundTreasures));
      treasureCountLabel.textContent = `${foundTreasures} / 3 found`;
      if (foundTreasures === 3) {
        pageComplete[5] = true;
        marsLandingScene.classList.add('ending');
        endingPanel.classList.add('show');
        showToast('Johnny and Max found all the Mars treasures!');
      } else {
        showToast(`${3 - foundTreasures} more dig spot${3 - foundTreasures === 1 ? '' : 's'} to explore.`);
      }
    });
  });
  restartButton.addEventListener('click', () => window.location.reload());

  const canvas = document.querySelector('#ideaCanvas');
  const context = canvas.getContext('2d');
  const ideaPinCanvas = document.querySelector('#ideaPinCanvas');
  const pinContext = ideaPinCanvas.getContext('2d');
  function syncIdeaPin() {
    if (!ideaPinCanvas) return;
    pinContext.clearRect(0, 0, ideaPinCanvas.width, ideaPinCanvas.height);
    pinContext.drawImage(canvas, 0, 0, ideaPinCanvas.width, ideaPinCanvas.height);
  }
  let drawing = false;
  let lastPoint = null;
  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    const source = event.touches ? event.touches[0] : event;
    return { x: (source.clientX - rect.left) * canvas.width / rect.width, y: (source.clientY - rect.top) * canvas.height / rect.height };
  }
  function beginDrawing(event) { event.preventDefault(); drawing = true; lastPoint = pointFromEvent(event); }
  function draw(event) { if (!drawing) return; event.preventDefault(); const point = pointFromEvent(event); context.beginPath(); context.moveTo(lastPoint.x, lastPoint.y); context.lineTo(point.x, point.y); context.strokeStyle = '#ff6f68'; context.lineWidth = 6; context.lineCap = 'round'; context.lineJoin = 'round'; context.stroke(); pageOneDrawingComplete = true; updatePageOneCompletion(); syncIdeaPin(); lastPoint = point; }
  function endDrawing() { drawing = false; lastPoint = null; }
  canvas.addEventListener('pointerdown', beginDrawing); canvas.addEventListener('pointermove', draw); canvas.addEventListener('pointerup', endDrawing); canvas.addEventListener('pointerleave', endDrawing);
  document.querySelector('#clearDrawing').addEventListener('click', () => { context.clearRect(0, 0, canvas.width, canvas.height); pageOneDrawingComplete = false; updatePageOneCompletion(); syncIdeaPin(); showToast('Fresh page, fresh idea!'); });

  syncIdeaPin();
  setPage(0, false);
})();
