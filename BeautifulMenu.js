/*
    BeautifulMenu: convenient arbitrarily-nested js/css menu
    Copyright (C) 2015  Adam Bourne

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

	Mail: Adam Bourne, 46 Landseer House, Francis Chichester Way, Battersea, London, UK (postcode: SW11 5HY)
*/

function getDefaultFontSize(pa){
pa= pa || document.body;
var who= document.createElement('div');

who.style.cssText='display:inline-block; padding:0; line-height:1; position:absolute; visibility:hidden; font-size:1em';

who.appendChild(document.createTextNode('M'));
pa.appendChild(who);
var fs= [who.offsetWidth, who.offsetHeight];
pa.removeChild(who);
return fs;
}

//alert(getDefaultFontSize()); 


function linearInterpolate(startValue, endValue, timeParameter, transitionTimingFunction){ // 0 <= interpolationParameter <= 1; 
	transitionTimingFunction = transitionTimingFunction || function(timeParameter){return timeParameter}; // default linear function; 
	var interpolationParameter = transitionTimingFunction(timeParameter); 
	var interpolatedValue = startValue*(1 - interpolationParameter) + endValue*interpolationParameter; 
	return interpolatedValue; 
}; 

function getClosedHeight(thisNode){ // remove node inner content (leaving behind pseudo nodes of thisNode), get height, reinstate inner content; 
	var savedHeight = thisNode.style.height; 
	var savedInnerHTML = thisNode.innerHTML; 
	thisNode.style.height = null; 
	thisNode.innerHTML = ""; 
	var style = getComputedStyle(thisNode), height = parseInt(style.getPropertyValue("height")); 
	thisNode.innerHTML = savedInnerHTML; 
	thisNode.style.height = savedHeight; 
	return height; 
}

function getOpenedHeight(node){ /* unset javascript height value, thus falling back to css height which wraps height flush to content, read this value then reset old unopened value */
	var savedHeight = node.style.height; 
	node.style.height = null; 
	var style = getComputedStyle(node), height = parseInt(style.getPropertyValue("height")); 
	node.style.height = savedHeight; 
	return height; 
}

function getPos(node) { // get x, y of node; 
	for (var lx=0, ly=0;
	node != null;
	lx += node.offsetLeft, ly += node.offsetTop, node = node.offsetParent);
	return {x: lx,y: ly};
}

function getWindowSize(){ // gets current window dimensions 
	var w = window, d = document, e = d.documentElement, g = d.getElementsByTagName('body')[0], 
	width = w.innerWidth || e.clientWidth || g.clientWidth, 
	height = w.innerHeight|| e.clientHeight|| g.clientHeight;
	return {'width': width, 'height': height}
}

// initialiseAll(): enable onclick for Safari by attaching blank functions to nodes. Also initialise all nodes as closed. Also set onchange function of text nodes to update value as innerHTML:- ; 

// add textAreaOnChange event handler to textareas so changes to their entered values are automatically updated in corresponding innerHTML; 

function textAreaOnChange(ev){ // update textarea innerHTML from changed value to record changes; 
	ev = ev || event; 
	var target = ev.target, value = target.value; 
	target.innerHTML = value; 
}; 


function initialiseAll(){
	// set menu folder/file divs; 
	var nodes = document.querySelectorAll('.menu, .menu div[type="folder"], .menu div[type="file"]'); 
	for (var n=nodes.length-1; n>=0; n--){ // close in reverse flattened order */
		var node = nodes[n]; 
		node.onclick = function(ev){}; 
		var closedHeight = getClosedHeight(node); 
		node.style.height = closedHeight + "px"; 
	}; 

	// set textarea onchange functions; 
	var textareas = document.querySelectorAll('.menu TEXTAREA'); 
	for (var n = 0; n < textareas.length; n++){
		var textarea = textareas[n]; 
		textarea.setAttribute("onchange", "textAreaOnChange(event); "); // insert into HTML as attribute so is recorded in innerHTML; 
	}
}

initialiseAll(); 


function onOpenedOrClosed(){
	this.animationId && clearInterval(this.animationId); 
	this.style.height = this.closedHeight + "px"; // if closed (see next line); 
	this.classList.contains("open") && (this.style.height = null); // override if now open: Reverts to css defined height I.e. wraps height to fit current contents automatically; 
	menu.style.left = menu.endX.toString() + "px"; 
	this.startX = null; 
	menu.startX = null; 
	menu.endX = null; 

	// remove any accompanying sound effect object; 
	menu.audioObject = null; 
}

function openOrClose(){ // interpolates this node height and x-coord properties according to start, end, time parameters during animation; 
	var height = linearInterpolate(this.startHeight, this.endHeight, this.animationTimeParameter, this.transitionTimingFunction); 
	this.style.height = parseInt(height) +"px"; 

	// translate horizontally too; 
	this.startX = this.startX || getPos(this).x;
	menu.startX = menu.startX || getPos(menu).x; 
	menu.endX = menu.startX - this.startX; 

	menu.setMenuHorizontalInterpolation(menu.startX, menu.endX, this.animationTimeParameter, cosTransitionTimingFunction); 
}

var animationDuration = 300; // in ms; 

HTMLElement.prototype.animate = function(){ // animate this menu element node, iterating with this.iterationFunction each time; 
	var thisNode = this; // I.e. this = menu element node

	thisNode.animationId && clearInterval(thisNode.animationId); 
	// set default values if not pre-set; 
	thisNode.iterationFunction = thisNode.iterationFunction || open; 
	thisNode.animationDuration = thisNode.animationDuration || animationDuration; 
	thisNode.animationStartTime = (new Date()).getTime(); 
	var iterationFunction = function(){
		var animationTime = (new Date()).getTime() - thisNode.animationStartTime; 
		thisNode.animationTimeParameter = animationTime/thisNode.animationDuration; 
		thisNode.iterationFunction(); 
		if (thisNode.animationTimeParameter >= 1){ // halt animation process; 
			clearInterval(thisNode.animationId); 
			thisNode.onAnimationEnd && thisNode.onAnimationEnd(); 
		}
	}; 
	thisNode.animationId = setInterval(iterationFunction, 0); 

	// play sound if allocated; 
	thisNode.audioObject && play(thisNode.audioObject, thisNode.animationDuration); 
}

var menu = document.querySelector(".menu"); 
cosTransitionTimingFunction = function(t){
	return (t > 1 && 1) || (1 - Math.cos(t*Math.PI))/2; 
}; 


// menu click function; 
var minYOverhang = 100; // minimum y coordinate for bottom of menu to overhang from top of screen; 

HTMLElement.prototype.slideVertically = function(){ // add vertical sliding animation with (preset) this.touchVelocity[1] (pixels/ms); 
	var thisMenu = this; // I.e. this = menu; 
	thisMenu.touchVelocity[1] = thisMenu.touchVelocity[1] || 0; // default stationary; 
	thisMenu.animationId && clearInterval(thisMenu.animationId); 
	thisMenu.animationId = window.setInterval(function(){
		var time = (new Date()).getTime(); 
		thisMenu.time = thisMenu.time || time; 
		var dt = time - thisMenu.time, dy = thisMenu.touchVelocity[1]*dt; 
		var menuY = getPos(thisMenu).y; 
		menuY = menuY + dy; 
		// if menu has slid to min or max y bounds then stop; 
		var menuHeight = parseInt(getComputedStyle(thisMenu).height); 
		var minY = Math.min(minYOverhang, menuHeight) - menuHeight, maxY = 0; 
		if (menuY <= minY ||menuY >= maxY){ // min or max y bound; 
			menuY <= minY && (menuY = minY); 
			menuY >= maxY && (menuY = maxY); 
			thisMenu.animationId && clearInterval(thisMenu.animationId); 
		}
		// update menu y coord; 
		thisMenu.style.top = menuY.toString() + "px"; 
		thisMenu.time = time; 
	}, 1); 
}

function slideHorizontally(ev){ // horizontal swipe; 
	var thisMenu = this; // I.e. this = menu; 
	ev = ev || event; 
	var targ = ev.target; 
	var targX = getPos(targ).x, menuX = getPos(thisMenu).x; 
	// animate menu sideways to get target node flush to LHS of screen; 
	thisMenu.startX = menuX; 
	thisMenu.endX = menuX - targX; 

	thisMenu.iterationFunction = function(){
		thisMenu.setMenuHorizontalInterpolation(thisMenu.startX, thisMenu.endX, thisMenu.animationTimeParameter, thisMenu.transitionTimingFunction); 
	}

	thisMenu.animate(); 
}


HTMLElement.prototype.setMenuHorizontalInterpolation = function(startX, endX, animationTimeParameter, transitionTimingFunction){ // set interpolated menu x coord animation frame and set width so menu flush to RHS; 
	var thisMenu = this; // I.e. this = menu; 
	var menuX = linearInterpolate(startX, endX, animationTimeParameter, transitionTimingFunction); 
	thisMenu.style.left = menuX.toString() + "px"; 
	// alter menu width so far RHS is flush to RHS of screen; 
	var newWidth = getWindowSize().width - menuX; 
	thisMenu.style.width = newWidth.toString() + "px"; 
}



function touchMoveEnd(ev){
	var thisMenu = this; // I.e. this = menu; 
	thisMenu.animationId && clearInterval(thisMenu.animationId); 
	if (Math.abs(thisMenu.dr[0]) > Math.abs(thisMenu.dr[1])){ // if more of a horizontal slide then cancel vertical momentum; 
		thisMenu.slideHorizontally = thisMenu.slideHorizontally || slideHorizontally; 
		thisMenu.slideHorizontally(ev); 
		return
	}
	// more of a vertical slide so add vertical slide momentum; 
	var dt = thisMenu.previousTime && ((new Date()).getTime() - thisMenu.previousTime); 
	thisMenu.touchVelocity = [thisMenu.dr[0]/dt, thisMenu.dr[1]/dt]
	thisMenu.slideVertically(); 
}

function isMenuTitle(node){
	var type = node.getAttribute("type"); 
	return type == "file" || type == "folder"
}

function touchEnd(ev){ // indicates 'click' event; 
	var thisMenu = this; // I.e. this = menu; 
	if (thisMenu.touchCoord){ // not a tap but a touch slide end;
		thisMenu.touchCoord = null; 
		thisMenu.touchMoveEnd = touchMoveEnd; 
		thisMenu.touchMoveEnd(ev); 
		return
	}; 

	// a single tap 'click' has occurred; 
	ev = ev || event; 
	var targ = ev.target; 

	// test if target a menu title (file or folder); 
	if (!isMenuTitle(targ)){return}; 

	// if so carry on; 
	ev.preventDefault(); // stop highlighting of menu text etc.; 

	// set/unset selected/deselected node; 
	thisMenu.selected && thisMenu.selected.classList.remove("selected"); 
	thisMenu.selected = targ; 
	targ.classList.add("selected"); 
	var name = targ.getAttribute('name'); 

	// toggle animate node open/closed; 
	if (targ.classList.contains('open')){
		targ.classList.remove('open'); 
		targ.startHeight = getOpenedHeight(targ); 
		targ.endHeight = getClosedHeight(targ); 

		// sound effect; 
		targ.audioObject = slideup; 
	}
	else {
		targ.classList.add('open'); 
		targ.startHeight = getClosedHeight(targ); 
		targ.endHeight = getOpenedHeight(targ); 

		// sound effect; 
		targ.audioObject = slidedown; 
	}

	targ.transitionTimingFunction = cosTransitionTimingFunction;
	targ.onAnimationEnd = onOpenedOrClosed; 
	targ.iterationFunction = openOrClose; 
	targ.animate(); 
}; 

menu.addEventListener("touchend", touchEnd); 
menu.addEventListener("mouseup", function(ev){this.isMousedown = null; this.touchEnd = touchEnd; this.touchEnd(ev); }); 

// menu slide functions; 
function getTouchXY(ev){
	// get touch coord; 
	var x = ev.clientX /* non-touchscreen */ || (ev.touches && ev.touches[0] && ev.touches[0].pageX) /* touchstart or touchmove event */ || (ev.changedTouches && ev.changedTouches[0].clientX) /* touchend event */; 
	var y = ev.clientY /* non-touchscreen */ || (ev.touches && ev.touches[0] && ev.touches[0].pageY) /* touchstart or touchmove event */|| (ev.changedTouches && ev.changedTouches[0].clientY) /* touchend event */; 
	return [x, y]; 
}

function touchMove(ev){
	ev = ev || event; 
	ev.preventDefault(); // prevent touch screen sliding all over the place; 
	var newTouchCoord = getTouchXY(ev), newTime = (new Date()).getTime(); 
	var thisMenu = this; // I.e. this = menu; 
	thisMenu.touchCoord = thisMenu.touchCoord || newTouchCoord; 
	thisMenu.time = thisMenu.time || newTime; 
	thisMenu.dr = [newTouchCoord[0] - thisMenu.touchCoord[0], newTouchCoord[1] - thisMenu.touchCoord[1]]; 
	var menuY = getPos(thisMenu).y; 
	menuY = menuY + thisMenu.dr[1]; 

	// if menu has slid to min or max y bounds then stop; 
	var menuHeight = parseInt(getComputedStyle(thisMenu).height); 
	var minY = Math.min(minYOverhang, menuHeight) - menuHeight, maxY = 0; 
	if (menuY <= minY || menuY >= maxY){ // min or max y bound; 
		menuY <= minY && (menuY = minY); 
		menuY >= maxY && (menuY = maxY); 
	}; 
	thisMenu.style.top = menuY.toString() + "px"; 

	thisMenu.previousTouchCoord = thisMenu.touchCoord; ////
	thisMenu.touchCoord = newTouchCoord; 
	thisMenu.previousTime = thisMenu.time; 
	thisMenu.time = newTime; 
}

menu.addEventListener("touchmove", touchMove); 
menu.addEventListener("mousemove", function(ev){
	if (!this.isMousedown){return}; 
	this.touchMove = touchMove; this.touchMove(ev); 
}); 

function endMomentum(){ // end any sliding animation; 
	var thisMenu = this; // I.e. this = menu; 
	if (thisMenu.animationId){ 
		clearInterval(thisMenu.animationId); 
		thisMenu.animationId = null; 
	}
}; 

menu.addEventListener("touchstart", endMomentum); // finger stops motion; 
menu.addEventListener("mousedown", function(ev){this.isMousedown = true; this.endMomentum = endMomentum; this.endMomentum()}); 

// reset menu to fit screen width upon resize; 
window.onresize = function(){
var screenWidth = getWindowSize().width, menuX = getPos(menu).x, newMenuWidth = screenWidth - menuX; 
menu.style.width = newMenuWidth.toString() + "px"; 
}












// sound handling; 

Audio.sounds = {}; 
function addAudio(id, src){
	var audio = document.createElement('AUDIO'), source = document.createElement('SOURCE'); 
	source.src = src; source.type = "audio/wav"; 
	audio.appendChild(source); 
	Audio.sounds[id] = audio; 
	document.body.appendChild(audio); 
	return audio; 
}

var slideup = addAudio("slideup", "http://home.onemain.com/~nospamtoday/noises/SLDWSTup.WAV"); 

var slidedown = addAudio("slidedown", "http://home.onemain.com/~nospamtoday/noises/SLDWSTdown.WAV"); 


function play(audioNode, durationToSetMs) { 
	var durationMs = audioNode.duration && audioNode.duration*1000; // in ms; 
	audioNode.playbackRate = (durationMs && durationMs/durationToSetMs); 
	audioNode.muted = !durationMs
	audioNode.play(); 
}


