let canvas;
let ctx;
let width;
let height;
let perspective;
let projectionCenterX;
let projectionCenterY;
let spawningSpeed;
let nbDots = 10;
function setupCanvas(){
	canvas = document.getElementById('scene');
	width = canvas.offsetWidth;
	height = canvas.offsetHeight;
	canvas.addEventListener('click',function(evt){
		console.log(evt.clientX + ',' + evt.clientY);
	},false);

	document.getElementById('perspectiveSlider').oninput = function(){
		perspective = width * (this.value / 100);
	}

	document.getElementById('spawningSlider').oninput = function(){
		spawningSpeed = +(this.value);
	}

	perspective = width * 0.8;
	spawningSpeed = 20;
	projectionCenterX = width / 4;
	projectionCenterY = height / 4;
	ctx = canvas.getContext('2d');
	function onResize () {
  		width = canvas.offsetWidth;
	  	height = canvas.offsetHeight;
	  
	  	if (window.devicePixelRatio > 1) {
	    	canvas.width = canvas.clientWidth * 2;
	    	canvas.height = canvas.clientHeight * 2;
	    	ctx.scale(2, 2);
	  	} else {
	    	canvas.width = width;
	    	canvas.height = height;
	  	}
	}
	window.addEventListener('resize', onResize);
	onResize();
	/*for(let i = 0; i < nbDots; i++){
		dots.push(new Dot());
	}*/
	dots.push(new Cube());

	gameloop();
}
window.onload = setupCanvas;
const dots = [];

function matMultiply(m1, m2){
	if(m1[0].length != m2.length)
		return undefined;
	var result = [];
	for(var r1 = 0; r1 < m1.length; ++r1){
		result.push([]);
		for(var c2 = 0; c2 < m2[r1].length; ++c2){
			var val = 0;
			for(var i = 0; i < m1[r1].length; ++i){
				val += m1[r1][i] * m2[i][c2];
			}
			result[r1].push(val);
		}
	}
	return result;
}

function matAdd(m1, m2){
	if(m1.length != m2.length || m1[0].length != m2[0].length)
		return undefined;
	result = [];
	for(var r = 0; r < m1.length; ++r){
		result.push([]);
		for(var c = 0; c < m1[r].length; ++c){
			result[r].push(m1[r][c] + m2[r][c]);
		}
	}
	return result;
}

function homogene(v){
	if(!v.length)
		return undefined;
	for(var c = 0; c < v[0].length; ++c){
		if(v[v.length-1][c] == 1)
			continue;
		for(var r = 0; r < v.length; ++r)
			v[r][c] /= v[v.length-1][c];
	}
	return v;
}

function matTranspose(m){
	if(!m.length)
		return undefined;
	var result = [];
	for(var c = 0; c < m[0].length; ++c){
		result.push([]);
		for(var r = 0; r < m.length; ++r){
			result[c].push(m[r][c]);
		}
	}
	return result;
}

class Dot{
	constructor(){
		this.x = (Math.random() - 0.50) * width;
		this.y = (Math.random() - 0.50) * height;
		this.z = Math.random() * width;
		this.radius = 10;


		this.xProjected = 0;
		this.yProjected = 0;
		this.scaleProjected = 0;
	}

	applyPhysics(){
		this.z += 1;
	}

	Project(){
		this.scaleProjected = perspective / (perspective + this.z);
		this.xProjected = (this.x * this.scaleProjected) + projectionCenterX;
		this.yProjected = (this.y * this.scaleProjected) + projectionCenterY;
	}

	Draw(){
		this.Project();

		ctx.globalAlpha = Math.abs(1 - this.z / width / 2);
		ctx.fillRect(this.xProjected - this.radius
			, this.yProjected - this.radius
			, this.radius * 2 * this.scaleProjected
			, this.radius * 2 * this.scaleProjected);
	}
}

class Obj3D{
	constructor(verts, lines){
		//this.verts = [[-1, -1, -1],[1, -1, -1],[-1, 1, -1],[1, 1, -1],[-1, -1, 1],[1, -1, 1],[-1, 1, 1],[1, 1, 1]];
		this.verts = [];
		for(var i = 0; i < verts.length; ++i){
			this.verts[i] = verts[i];
			this.verts[i].push(1);
		}
		this.nVerts = this.verts;

		this.verts = verts;
		this.lines = lines

		this.xProjected = [];
		this.yProjected = [];
		this.scaleProjected = [];
		for(var i = 0; i < this.verts.length; ++i){
			this.xProjected.push(0);
			this.yProjected.push(0);
			this.scaleProjected.push(0);
		}

		this.matTransform = 
			[[1,0,0,0],
			 [0,1,0,0],
			 [0,0,1,0],
			 [0,0,0,1]];
	}

	scale(x, y, z){
		this.matTransform = matMultiply(this.matTransform, 
			[[x,0,0,0],
			 [0,y,0,0],
			 [0,0,z,0],
			 [0,0,0,1]]);
	}

	scaleAll(s){
		this.scale(s,s,s);
	}

	translate(x,y,z){
		this.matTransform = matMultiply(this.matTransform, 
			[[1,0,0,x],
			 [0,1,0,y],
			 [0,0,1,z],
			 [0,0,0,1]]);
	}

	rotate(x,y,z){
		if(x){
			var c = Math.cos(x), s = Math.sin(x)
			this.matTransform = matMultiply(this.matTransform, 
			[[1,0,0,0],
			 [0,c,-s,0],
			 [0,s,c,0],
			 [0,0,0,1]]);
		}
		if(y){
			var c = Math.cos(y), s = Math.sin(y)
			this.matTransform = matMultiply(this.matTransform, 
			[[c,0,s,0],
			 [0,1,0,0],
			 [-s,0,c,0],
			 [0,0,0,1]]);
		}
		if(z){
			var c = Math.cos(z), s = Math.sin(z)
			this.matTransform = matMultiply(this.matTransform, 
			[[c,-s,0,0],
			 [s,c,0,0],
			 [0,0,1,0],
			 [0,0,0,1]]);		}
	}

	applyTransform(){
		this.nVerts = (matTranspose(homogene(matMultiply(this.matTransform, matTranspose(this.verts)))));
	}

	applyPhysics(){
		
	}

	Project(){
		for(var i = 0; i < this.nVerts.length; ++i){
			this.scaleProjected[i] = perspective / (perspective + this.nVerts[i][2]);
			this.xProjected[i] = (this.nVerts[i][0] * this.scaleProjected[i]) + projectionCenterX;
			this.yProjected[i] = (this.nVerts[i][1] * this.scaleProjected[i]) + projectionCenterY;
		}
	}

	Draw(){
		this.applyTransform();
		this.Project();
		ctx.globalAlpha = Math.abs(1 - this.z / width / 2);
		ctx.beginPath();
		for(var i = 0; i < this.lines.length; ++i){
			var from = [this.xProjected[this.lines[i][0]], this.yProjected[this.lines[i][0]]]
			var to = [this.xProjected[this.lines[i][1]], this.yProjected[this.lines[i][1]]]
			ctx.moveTo(from[0], from[1]);
			ctx.lineTo(to[0], to[1]);
		}
		ctx.stroke();
	}

}



class Cube extends Obj3D{
	constructor(){
		super([[75, 75, 0],[150, 75, 0],[75, 150, 0],[150, 150, 0],[75, 75, 75],[150, 75, 75],[75, 150, 75],[150, 150, 75]],
			[[0, 1], [1, 3], [3, 2], [2, 0], [2, 6], [3, 7], [0, 4], [1, 5], [6, 7], [6, 4], [7, 5], [4, 5]]);
	}
}

function gameloop(){
	applyPhysics();
	doShits();
	render();
	window.requestAnimationFrame(gameloop);
}
var t = 0;
function doShits(){
	t++;
	if( spawningSpeed && t % (21 - spawningSpeed) == 0){
		dots[0].rotate(0.1,0.1,);
	}
}

function applyPhysics(){
	for(var i = 0; i < dots.length; i++){
		dots[i].applyPhysics();
	}
}

function render(){
	ctx.clearRect(0,0,width, height);
	for(var i = 0; i < dots.length; i++){
		dots[i].Draw();
	}
}