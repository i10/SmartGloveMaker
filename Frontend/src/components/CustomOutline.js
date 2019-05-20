import React from 'react'; 


import '../css/routingView.css';

// https://github.com/gfwilliams/svgtoeagle
import '../js/simplify.js';
import '../js/svgtoeagle.js';

import {download_script,convert} from '../js/svgtoeagle.js'

const patternPixelDimension = {width: 1155.3, height:801.6}

const enums = { 
    buttonsChosen: [
        "GND",
        "VOL",
        "RX",
        "TX",
        "A0",
        "A1",
        "A2",
        "A3",
        "A4",
        "A5",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
    ],
    svgClickStates: {
        none: "NONE",
        button: "BUTTON",
        pin: "PIN"
    }
}

export class CustomOutline extends React.Component{

	constructor(props) { 
        super(props); 
        this.state = {  
            pt:0, 
            flow: 1,
            modalOpen: false,
            warning:"",
            step:5,
            isSVGLoaded: false,
            svgWidth: patternPixelDimension.x,
            svgHeight: patternPixelDimension.y,

            absoluteX: 0,
            absoluteY: 0,

            dimensionX: 0,
            dimensionY: 0,

            pointIndex: 0,
            points: [],
            buttons: [],
            pins: [],
            objects: [],
            toggleNextState: enums.svgClickStates.button,

            pinName: null,
            btnName: null,
            convCoords: '',
            svg2eagle: '',
          }; 
        this.handleBackClick = this.handleBackClick.bind(this);
        //this.handleNextClick = this.handleNextClick.bind(this);

        this.handleStepClick = this.handleStepClick.bind(this); 
        this.handleImportClick = this.handleImportClick.bind(this); 

        this.handlePinName = this.handlePinName.bind(this);
        this.handleButtonName = this.handleButtonName.bind(this);

        this.handleDeleteButton = this.handleDeleteButton.bind(this);
        this.handleConvertCoordsButton = this.handleConvertCoordsButton.bind(this);

        // svg file upload
        this.handleOpenExplorerOnEnter = this.handleOpenExplorerOnEnter.bind(this);
        this.handleOpenExplorerOnClick = this.handleOpenExplorerOnClick.bind(this);
        this.handleOnLoadFile = this.handleOnLoadFile.bind(this); 

        this.handleSVGClick = this.handleSVGClick.bind(this);

        this.handleConvertClick = this.handleConvertClick.bind(this);
        this.handleDownloadConvertedClick = this.handleDownloadConvertedClick.bind(this);

        this.escFunction = this.escFunction.bind(this);
    }

    /* HELPER: map coordinates in{min,max} => out{min,max} */
    scale = (num, in_min, in_max, out_min, out_max) => {
        /*console.log([
            num, in_min, in_max, out_min, out_max
        ]);*/
        return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

    /* BACK BUTTON */
    handleBackClick() { 
        if(this.state.flow>1){ 
          this.setState({ flow:  this.state.flow - 1 }); 
        } 
        else if(this.state.flow === 1){
          this.props.wizard.setState({step:1});
        } 
    } 

    handlePinName(pin) { 
        this.setState({pinName:pin})
    }
    
    handleButtonName(pin) { 
        this.setState({btnName:pin})
    } 

    handleDeleteButton(index) {
        if ( index === -1 ) // delete all
        {
            this.setState({
                buttons: [],
                pins: []
            });
        }
        if ( this.state.toggleNextState === enums.svgClickStates.pin ) {
            this.deleteLastButton();
            return;
        }
        
        if ( index >= this.state.buttons.length || index < 0)
        {
            console.warn("deleting uknown" + index);
            return;
        }
        //console.warn("deleting " + index);
        let newBtns = this.state.buttons;
        newBtns.splice(index, 1);
        let newPins = this.state.pins;
        newPins.splice(index, 1);
        this.setState({
            //pointIndex: this.state.pointIndex - 1,
            buttons: newBtns,
            pins: newPins
        });
    }

    // handle esc function
    // https://stackoverflow.com/a/46123962/665159
    escFunction(event) {
        if(event.keyCode === 27) {
            // abort drawing if active
            if (this.state.toggleNextState === enums.svgClickStates.pin) {
                this.deleteLastButton();
            }
        }
    }
    deleteLastButton() {
        let newBtns = this.state.buttons;
        newBtns.pop();
        this.setState({
            toggleNextState: enums.svgClickStates.button,
            pointIndex: this.state.pointIndex - 1,
            buttons: newBtns
        });
    }
    componentDidMount() {
        window.react_this = this;
        this.setState({pt: this.refs.mainSVG.createSVGPoint()});
        document.addEventListener("keydown", this.escFunction, false);
    }
    componentWillUnmount() {
        document.removeEventListener("keydown", this.escFunction, false);
    }

    handleUpdate(objects) {
        this.setState({objects});
    }

    /* DRAWING CLICK - place button/pin */
    handleSVGClick() {

        let pointLabel = this.state.pointIndex + "";
        if ( this.state.pointIndex < enums.buttonsChosen.length )
        {
            pointLabel = enums.buttonsChosen[this.state.pointIndex];
        } 
        else 
        {
            pointLabel = "BTN" + (this.state.pointIndex - enums.buttonsChosen.length);
        }
        /*
        console.log([
            'CLICKED',
            [this.state.pointIndex + "/" + enums.buttonsChosen.length, this.state.toggleNextState]
        ]);
        */

        switch (this.state.toggleNextState) {
            // JUST ADD POINTS
            default:
            case enums.svgClickStates.none:
                //console.log('something\'s ducky');
                //this.setState({toggleNextState: enums.svgClickStates.button});
                let newPoints = this.state.points.concat({
                    label: pointLabel, 
                    x:this.state.dimensionX, 
                    y:this.state.dimensionY,
                    vectorX:this.state.absoluteX,
                    vectorY:this.state.absoluteY
                });
                
                this.setState({
                    points: newPoints,
                    pointIndex: this.state.pointIndex + 1
                });
                break;
            // ADD A BUTTON
            case enums.svgClickStates.button:
                let newButtons = this.state.buttons.concat({
                    label: pointLabel, 
                    x:this.state.dimensionX, 
                    y:this.state.dimensionY,
                    vectorX:this.state.absoluteX,
                    vectorY:this.state.absoluteY
                });
                
                this.setState({
                    buttons: newButtons,
                    //pointIndex: this.state.pointIndex + 1
                });
                this.setState({toggleNextState: enums.svgClickStates.pin});
                break;
            
            // ADD A CONTROLLER PIN
            case enums.svgClickStates.pin:
                let newPins = this.state.pins.concat({
                    label: pointLabel, 
                    x:this.state.dimensionX, 
                    y:this.state.dimensionY,
                    vectorX:this.state.absoluteX,
                    vectorY:this.state.absoluteY
                });
                
                this.setState({
                    pins: newPins,
                    pointIndex: this.state.pointIndex + 1
                });
                this.setState({toggleNextState: enums.svgClickStates.button});
                break;
        }
        
    }

    /* CONVERT CLICK - input & draw svg, convert to scr */
    handleConvertClick() {
        this.handleDeleteButton(-1);
        convert();
    }
    handleDownloadConvertedClick() {
        download_script();
    }

    _onMouseMove(e) {
        /*let svgHeight = this.mainSVG.clientHeight;
        let svgWidth = this.mainSVG.clientWidth;

        let x = (e.nativeEvent.offsetX - 0) * (patternPixelDimension.width - 0) / (svgHeight - 0) + 0;
        let y =(e.nativeEvent.offsetY - 0) * (patternPixelDimension.height - 0) / (svgWidth - 0) + 0;
        */
        //console.log(e.target);
        if (e.target.tagName.toLowerCase() !== 'svg') 
        { 
            return;
        }
        e.preventDefault();
        var ptx = this.state.pt;
        ptx.x = e.clientX;
        ptx.y = e.clientY;
        this.setState({
            pt: ptx
        })
        
        // The cursor point, translated into svg coordinates
        var cursorpt =  ptx.matrixTransform(this.refs.mainSVG.getScreenCTM().inverse());
        //console.log("(" + cursorpt.x + ", " + cursorpt.y + ")");
        let x = cursorpt.x;
        let y = cursorpt.y;
        /*console.log([
            x, y
        ]);*/

        // https://stackoverflow.com/a/42183459/665159
        this.setState({ 
            absoluteX: e.nativeEvent.offsetX, 
            absoluteY: e.nativeEvent.offsetY,
            
            dimensionX: x,//this.scale(e.nativeEvent.offsetX, 420, 420, patternPixelDimension.width, patternPixelDimension.height),
            dimensionY: y//this.scale(e.nativeEvent.offsetY, 420, 420, patternPixelDimension.width, patternPixelDimension.height)
        });
        
    }

    navPrev(){ 
        return (
            <a className="navButton back " onClick={this.handleBackClick} >
                    <img  alt="Step Back" src={require('../img/arrow.svg')}/>
            </a>
        );
    } 
    /*
    navNext(){  
        return (
          <span>
            <span ref="popOver" className={(this.state.modalOpen===false)? "popOver hidden": "popOver shake"} >
              <p>{this.state.warning}</p>
              <span className="pointer"></span>
            </span>  
            <a ref="nextBtn" className={"navButton next"} onClick={this.handleNextClick} >
                <img  alt="Step Further" src={require('../img/arrowNext.svg')}/>
            </a>   
          </span> 
          );
      }
    */

    prepareAddButtonPinString(index, btnX, btnY, pinX, pinY, btnName, pinName, btnRot = "MR0", pinRot = "R0") {
        /*
            NET (0 0) (20 0); 
            ADD 'SEW_HOLE' BUTTON1 MR0 (0 0); 
            ADD 'SEW_HOLE-SMALL' PINThumb R0 (20 0); 
        */
        const addCommand = "ADD";
        const btnElement = "SEW_HOLE";
        const pinElement = "SEW_HOLE-SMALL";
        const x1 = 0;
        const x2 = 20;
        const y1 = index * 15;
        const y2 = index * 15;
        const btnXY = "(" + x1 + " " + y1 + ")";
        const pinXY = "(" + x2 + " " + y2 + ")";

        const net = "NET " + btnXY + " " + pinXY + "\n";
        const addBtn = addCommand + " '" + btnElement + "' " + btnName + " " + btnRot + " " + btnXY + ";\n";
        const addPin = addCommand + " '" + pinElement + "' " + pinName + " " + pinRot + " " + pinXY + ";\n";

        return net + addBtn + addPin;
    }

    prepareMoveButtonPinString(index, btnX, btnY, pinX, pinY, btnName, pinName)
    {
        const moveCommand = "MOVE";
        const btnXY = "(" + btnX + " " + btnY + ")";
        const pinXY = "(" + pinX + " " + pinY + ")";
        const moveBtn = moveCommand + " " + btnName + " " + btnXY + ";\n";
        const movePin = moveCommand + " " + pinName + " " + pinXY + ";\n";
        return moveBtn + movePin;
    }

    handleConvertCoordsButton() {
        const NL = "\n";
        const editSchematic = "EDIT .SCH;" + "\n";
        const editBoard = "EDIT .BRD;" + "\n";
        const changeLayerTop = "CHANGE LAYER 1;" + "\n";
        const gridMM = "GRID MM;" + "\n";
        const setWireWidth = "SET NET_WIRE_WIDTH 0.1;" + "\n";

        /*
            const setWireBend = "SET WIRE_BEND 2;" + "\n";
            const setWidth0 = "SET WIDTH 0.0;" + "\n";
            const changePourSolid = "CHANGE POUR SOLID;" + "\n";
            const changeLayerToDimension = "LAYER  20;" + "\n";
            const windowFit = "WINDOW FIT" + "\n";
        */

        let outputStr = "";
        let addStr = "";
        let moveStr = "";
        let divScale = this.refs.svgScale.value;
        let SVGBounds = this.refs.mainSVG.getBoundingClientRect();
        //console.log(this.refs.mainSVG.width + " x " + this.refs.mainSVG.height);
        let viewbox_parsed = this.refs.mainSVG.getAttribute("viewBox").split(" ").splice(-2, 2);
        viewbox_parsed = {
            x: +viewbox_parsed[0], 
            y: +viewbox_parsed[1]
        };
        //console.log(viewbox_parsed);
            for (let pinIndex = 0; pinIndex < this.state.pins.length; pinIndex++) {
                const pin = this.state.pins[pinIndex];
                const btn = this.state.buttons[pinIndex];
                //console.log(pin);
                //console.log(btn);
                // divide by scale, map to inverse y range
                /* 
                    SVG:
                    ---->  X
                    |
                    |
                    V Y
                
                    EAGLE:
                    ^ Y
                    |
                    | 
                    ----> X
                */
                
                addStr += this.prepareAddButtonPinString(
                    pinIndex, 
                    this.scale(btn.vectorX, 0 , SVGBounds.width, 0, viewbox_parsed.x ),
                    this.scale(btn.vectorY, 0, SVGBounds.height, viewbox_parsed.y, 0),
                    this.scale(pin.vectorX, 0 , SVGBounds.width, 0, viewbox_parsed.x ),
                    this.scale(pin.vectorY, 0, SVGBounds.height, viewbox_parsed.y, 0),
                    "B_" + btn.label,
                    "P_" + pin.label
                );
                moveStr += this.prepareMoveButtonPinString(
                    pinIndex, 
                    this.scale(btn.vectorX, 0 , SVGBounds.width, 0, viewbox_parsed.x ),
                    this.scale(btn.vectorY, 0, SVGBounds.height, viewbox_parsed.y, 0),
                    this.scale(pin.vectorX, 0 , SVGBounds.width, 0, viewbox_parsed.x ),
                    this.scale(pin.vectorY, 0, SVGBounds.height, viewbox_parsed.y, 0),
                    "B_" + btn.label,
                    "P_" + pin.label
                );
            }
            outputStr += "# ADD BUTTONS AND PINS \n";
            outputStr += editSchematic + gridMM + setWireWidth + addStr + NL;
            outputStr += editBoard + changeLayerTop + gridMM + moveStr;
        
        this.setState({convCoords: outputStr});
    }

	handleStepClick(step) {  
		this.setState({ step:  step}); 
    } 
    
    handleImportClick() {  
		 alert('hello world');
    } 
    
    handleOpenExplorerOnClick(event){ 
        this.refs.eagleSVG.focus();  
        this.refs.eagleSVG.click(); 
    }

    handleOpenExplorerOnEnter(event){
        if ( event.keyCode === 13 || event.keyCode === 32 ) {  
            this.refs.eagleSVG.focus();  
            this.refs.eagleSVG.click();
        } 
    }

    handleOnLoadFile(){    
        let component = this;
        let files = this.refs.eagleSVG.files;   
        
        let  reader= new FileReader();
        reader.onload = function(e) {
            let allText = e.target.result; 
            
            // PARSE XML
            let XMLParser = require('react-xml-parser');
            let xml = new XMLParser().parseFromString(allText);    // Assume xmlText contains the example XML
            /*let svgTag = xml.getElementsByTagName('svg')[0];
            
            let signals = xml.getElementsByTagName('signal');
            let wires = []; 
            for(let signal in signals){  
            Object.keys(signals[signal].children).reduce(function(r, e) {
                if (signals[signal].children[e].name === "wire")  wires.push(signals[signal].children[e].attributes)
            }, {}) 
            }  
            component.props.designer.setState({wires:wires});
            */
            // SEND SVG TO RENDERING = copy to html tag
            component.refs.mainSVG.innerHTML = allText;
            //this.mainSVG.innerHTML = allText;
            component.setState({isSVGLoaded:true});
            console.log("loaded.");
        };
        reader.readAsText(files[0]);
    }

    render() {  
        const { absoluteX, absoluteY, dimensionX, dimensionY } = this.state;

        return ( 
            <div className="col customOutlineViewWrapper">
                <div id="step-glove" className="col pad-30-h panel">         
                    {/* TOOLBAR */}
                    <div className="row frame toolBar" style={{height: "57px"}}>  
                        <div className="col-3">
                            {this.navPrev()}
                            <div className="flowLabel">
                                <span>Home</span>
                            </div>
                        </div>
                        <div className="col-6 mainTitle">
                            <div className="title">
                                Design Custom Outline                    
                            </div>
                        </div>
                        <div className="col-3 hidden">

                        </div>
                            {/*
                                <div className="col"> 
                                {this.navNext()}
                                <div className="flowLabel right">
                                    <span>Next Step
                                    </span>
                                </div>
                                </div> 
                            */}
                    </div>

                    {/* MAIN CONTENT */}
                    <div id="gridWrapper">
                        {/* WHITE OUTSIDE FRAME - Drawing */}
                        <div className="frame pad-30">

                            {/* SECTION TITLE
                            <div className="row">
                                <h2 className="marginTop25 text-center">
                                    SVG TO EAGLE
                                </h2>
                            </div>
                             */}

                            {/*  SVG TO EAGLE  */}
                            <div className="row pad-10">

                                {/* WORKSPACE */}
                                <div className="col-md-8 order-md-2 mb-4">
                                    <h4 className="mb-3 text-center">
                                        <span className="text-muted">Workspace</span> <br />
                                        <small className="text-muted text-xs">Mouse coordinates: { absoluteX } { absoluteY } | Eagle coordinates: { dimensionX.toFixed(2) } { dimensionY.toFixed(2) }</small>
                                    </h4>
                                    <div className="mb-3 drawing-parent bordered clearfix a" ref="mainSVGParent">
                                        <div id="container" ></div>
                                        <canvas id="can" width="300" height="10" className="drawing-canvas" />
                                        <svg
                                                ref="mainSVG"
                                                className="marginAuto displayBlock mainSVG"
                                                onMouseMove={this._onMouseMove.bind(this)}
                                                onClick={this.handleSVGClick}
                                                id="mainSVG"
                                                viewBox={`0 0 0 0`}
                                                >
                                                {/*
                                                    width="300"
                                                    height="10"
                                                    onLoad={() => ( this.setState({pt: this.refs.mainSVG.createSVGPoint()}) )}
                                                */}
                                                {/*>  
                                                
                                                    <image  ref="mainShowImg" id="mainShowImg"
                                                        xlinkHref={require('../img/glovePatternStrokeMM.svg')}  
                                                        width={patternPixelDimension.width}
                                                        height={patternPixelDimension.height} />*/}
                                                {/**/}


                                                {/*
                                                    ({points})
                                                    {points.map((point, index))}

                                                    fill={( this.state.activepoints.includes(point) === true || 
                                                                            this.state.activepoint === point)? "#FF004E": "#17c0b7"} 
                                                                        transform={this.rotateCoordinate()}

                                                                    
                                                                    onClick={() => this.handleButtonMappointg(point)} 
                                                                    onMouseEnter={() => this.handlepointName(point)} 
                                                                    onMouseLeave={() => this.handlepointName("")} 
                                                                        
        */}
                                                    {Object.keys(this.state.points).map(point => (
                                                        <React.Fragment key={`point${point}`}> 
                                                                <circle id={`point_${point}`}
                                                                        cx={this.state.points[point].x} 
                                                                        cy={this.state.points[point].y} 
                                                                        r="1"  
                                                                        stroke="black" 
                                                                        strokeWidth="0.5" 
                                                                        
                                                                        fill="#FF004E"
                                                                        className="point"
                                                                />  
                                                        </React.Fragment>                          
                                                    ))}

                                                    {/*  BUTTONS  */}
                                                    {Object.keys(this.state.buttons).map(point => (
                                                        <React.Fragment key={`point${point}`}> 
                                                                <circle id={`button_${point}`}
                                                                        cx={this.state.buttons[point].x} 
                                                                        cy={this.state.buttons[point].y} 
                                                                        r="2"  
                                                                        stroke="orange" 
                                                                        strokeWidth="0.5"
                                                                        fill="#FF9900"
                                                                        className="point"
                                                                        onMouseEnter={() => this.handleButtonName(point)} 
                                                                        onMouseLeave={() => this.handleButtonName("")} 
                                                                >
                                                                    <title>[BTN] {enums.buttonsChosen[point]}</title>
                                                                </circle>
                                                        </React.Fragment>                          
                                                    ))}

                                                    {/*  CONTROLLER PINS  */}
                                                    {Object.keys(this.state.pins).map(point => (
                                                        <React.Fragment key={`point${point}`}> 
                                                                <circle id={`pin_${point}`}
                                                                        cx={this.state.pins[point].x} 
                                                                        cy={this.state.pins[point].y} 
                                                                        r="2"  
                                                                        stroke="blue" 
                                                                        strokeWidth="0.5" 
                                                                        fill="#0060ff"
                                                                        className="point"
                                                                        onMouseEnter={() => this.handlePinName(point)} 
                                                                        onMouseLeave={() => this.handlePinName("")} 
                                                                >
                                                                    <title>[PIN] {enums.buttonsChosen[point]}</title>
                                                                </circle>
                                                        </React.Fragment>                          
                                                    ))}

                                                    {/* FOR EACH PIN THERE IS A BUTTON - CONNECT WITH LINE */}
                                                    {Object.keys(this.state.pins).map(mapping => ( 
                                                        <React.Fragment key={`line${mapping}`}>
                                                        <line 
                                                            x1={this.state.buttons[mapping].x} 
                                                            y1={this.state.buttons[mapping].y} 
                                                            x2={this.state.pins[mapping].x}
                                                            y2={this.state.pins[mapping].y}
                                                            stroke="black" 
                                                            className="line" 
                                                            strokeLinecap="round"
                                                            />
                                                        </React.Fragment>
                                                    ))}

                                                    {/* CURRENTLY DRAWING - CONNECT LAST BUTTON WITH DASHED LINE TO MOUSE POSITION */}
                                                    {( this.state.toggleNextState === enums.svgClickStates.pin ) ? 
                                                    
                                                        <React.Fragment key={`line${this.state.buttons.length - 1}`}>
                                                            <line 
                                                                x1={this.state.buttons[this.state.buttons.length - 1].x} 
                                                                y1={this.state.buttons[this.state.buttons.length - 1].y} 
                                                                x2={this.state.dimensionX}
                                                                y2={this.state.dimensionY}
                                                                stroke="gray" 
                                                                strokeDasharray="6"
                                                                strokeWidth="0.5"
                                                                className="line" 
                                                                strokeLinecap="round"
                                                                />
                                                        </React.Fragment>
                                                        : ""
                                                
                                                    }
                                                
                                            </svg>
                                             
                                    </div>





                                    {/* CONNECTIONS */}
                                    <div className="marginTop25" ref="pointsList">
                                        <div className="col-md-12">
                                            <h5 className="mb-3 text-center">
                                                <span className="text-muted">Connections &nbsp;</span>
                                                {( this.state.pins.length > 0 ) ? 
                                                    <button 
                                                        type="button" 
                                                        onClick={() => this.handleDeleteButton(-1)}
                                                        className="btn btn-sm btn-outline-danger">
                                                        Remove All
                                                    </button>
                                                    : ""
                                                }
                                            </h5>
                                            <div className="conn-collection">
                                                {Object.keys(this.state.pins).map(index => ( 
                                                    <React.Fragment key={`point${index}`}>
                                                        <div className="connection">
                                                            <small>
                                                                <span className="delete-x" onClick={() => this.handleDeleteButton(index)} title={`DELETE ${this.state.buttons[index].label}`}> X </span> &nbsp;
                                                                [{index}] &nbsp;
                                                                    <strong>{this.state.buttons[index].label}: </strong>
                                                                        <span className="orange dot">&#9679;</span> 
                                                                        <span className="orange dot">( {this.state.buttons[index].x.toFixed(1)} | {this.state.buttons[index].y.toFixed(1)} )</span> 
                                                                    &nbsp; &rArr; &nbsp;
                                                                        <span className="blue dot">&#9679;</span> 
                                                                        <span className="blue dot">( {this.state.pins[index].x.toFixed(1)} | {this.state.pins[index].y.toFixed(1)} )</span>
                                                                
                                                            </small>
                                                        </div>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>

                                {/*  CONFIG  */}      
                                <div className="col-md-4 order-md-1">
                                        <h4 className="mb-3 text-center">
                                            <span className="text-muted">Config</span>
                                        </h4>

                                        <div className="input-group mb-3">
                                            <div className="input-group-prepend">
                                                <span 
                                                    className="input-group-text" 
                                                    id="eagleLayerLabel" 
                                                    htmlFor="eagleLayer">
                                                        Layer ID &nbsp; &nbsp; 
                                                        
                                                </span>
                                            </div>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="eagleLayer" 
                                                aria-describedby="eagleLayerLabel" 
                                                placeholder="Eagle CAD Layer" 
                                                defaultValue="20" 
                                                required
                                                />

                                            <div className="input-group-append">
                                                <span className="input-group-text">
                                                    <small className="text-muted">20 = tDimension</small>
                                                </span>
                                            </div>

                                            <div className="invalid-feedback">
                                                Eagle CAD Layer is required.
                                            </div>
                                        </div>

                                        <div className="input-group mb-3">
                                            <div className="input-group-prepend">
                                                <span 
                                                    className="input-group-text" 
                                                    id="signalNameLabel" 
                                                    htmlFor="signalName">
                                                        Signal Name
                                                </span>
                                            </div>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="signalName" 
                                                aria-describedby="signalNameLabel" 
                                                placeholder="Signal Name" 
                                                defaultValue="GND" 
                                                required
                                                />

                                            <div className="invalid-feedback">
                                                Signal Name is required.
                                            </div>
                                        </div>

                                        <div className="input-group mb-3">
                                            <div className="input-group-prepend">
                                                <span 
                                                    className="input-group-text" 
                                                    id="svgScaleLabel" 
                                                    htmlFor="svgScale">
                                                        SVG scale Factor
                                                </span>
                                            </div>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="svgScale" 
                                                ref="svgScale"
                                                aria-describedby="svgScaleLabel" 
                                                placeholder="SVG Scale Factor" 
                                                defaultValue="3.542" 
                                                required
                                                />

                                            <div className="invalid-feedback">
                                                SVG Scale Factor is required.
                                            </div>
                                        </div>

                                        <div className="input-group mb-3">
                                            <div className="form-control grey-bg">
                                                <span className="">Output format</span>
                                            </div>
                                            <div className="input-group-append">
                                                <div className="input-group-text white-bg">
                                                    <input type="radio" id="wire" name="eagleformat" defaultValue="wire" defaultChecked required />
                                                    <label htmlFor="wire" className="nomargin"><span>&nbsp; Wire &nbsp; </span></label>
                                                </div>
                                            </div>

                                            <div className="input-group-append">
                                                <div className="input-group-text white-bg">
                                                    <input type="radio" id="board" name="eagleformat" value="board" required  />
                                                    <label htmlFor="board" className="nomargin"><span>&nbsp; Polygon &nbsp; </span></label>
                                                </div>
                                            </div>
                                        </div>


                                        <div className="input-group mb-3">
                                            
                                            <div className="form-control grey-bg">
                                                <div className="">
                                                    <label htmlFor="flipImage" className="nomargin">
                                                        Flip image?
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="input-group-append">
                                                <div className="input-group-text white-bg">
                                                    Horizontally &nbsp;
                                                    <input type="checkbox" id="flipImage" aria-label="Flip image horizontally?" />
                                                </div>
                                            </div>
                                        </div>

                                        <input className="btn btn-lg btn-block" type="file" id="fileLoader"/><br/>

                                        <div className="mb-3">
                                            <p id="dimensions"></p>
                                        </div>
                                        <div id="log" className="alert alert-warning" style={{display: "none"}} role="alert">
                                        </div>

                                        

                                        

                                        {/* 
                                        <div className="row">
                                        <div className="col-md-4"><h6>Output format:</h6></div>
                                        <div className="col-md-4">
                                            <div className="custom-control custom-radio">
                                                <input id="wire" name="eagleformat" type="radio" className="custom-control-input" defaultValue="wire" defaultChecked required />
                                                <label className="custom-control-label" htmlFor="wire">Wire</label>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="custom-control custom-radio">
                                                <input id="board" name="eagleformat" type="radio" className="custom-control-input" value="board" required />
                                                <label className="custom-control-label" htmlFor="board">Polygon</label>
                                            </div>
                                        </div>
                                        
                                        <div className=" col-md-4">
                                            <div className="custom-control custom-radio">
                                                <input id="library" name="eagleformat" type="radio" className="custom-control-input" defaultValue="library" required />
                                                <label className="custom-control-label" htmlFor="library">Library</label>
                                            </div>
                                        </div>
                                        </div>
                                        <hr className="mb-4" />
                                        <div className="custom-control custom-checkbox">
                                        <input type="checkbox" className="custom-control-input" id="flipImage" />
                                        <label className="custom-control-label" htmlFor="flipImage">Flip image horizontally?</label>
                                        </div>
                                        <hr className="mb-4" />
                                        <input className="btn btn-lg btn-block" type="file" id="fileLoader"/><br/>
                                        */}
                                </div>
                                
                            </div>

                            <div className="row md-3">
                                <div className="col-md-8 order-md-2 mb-4 pad-20">
                                    <button 
                                        className="btn btn-primary btn-block btn-lg btn-block" 
                                        onClick={() => this.handleConvertCoordsButton()}>
                                            2. Convert Connections
                                        </button>
                                </div>

                                <div className="col-md-4 order-md-1 mb-4 pad-20">
                                    <button 
                                        className="btn btn-primary btn-lg btn-block" 
                                        onClick={this.handleConvertClick} >
                                            1. Convert SVG to EAGLE
                                        </button>
                                </div>
                            </div>          
                        </div>

                        {/* WHITE OUTSIDE FRAME */}
                        <div className="frame pad-30">
                            {/* className="hidden-x"  */}
                            <textarea className="form-control" id="combined-result" value={this.state.svg2eagle + "\n" + this.state.convCoords} rows="9" readOnly></textarea>
                            <textarea className="form-control hidden-x" id="result" rows="9" readOnly></textarea>
                            
                            <div className="mb-3">
                                <button 
                                    className="btn btn-primary btn-lg btn-block" 
                                    id="dwn-btn" 
                                    onClick={() => this.handleDownloadConvertedClick()} 
                                    >
                                    3. Download eagle script
                                </button>
                            </div>
                            
                            
                        
                        </div>
                            <div className="frame pad-10 my-5 pt-5 text-muted text-center text-smaller">
                                <p className="mb-1"><a href="https://github.com/gfwilliams/svgtoeagle">SVG to EAGLE by Gordon Williams</a></p>
                            </div>
                        </div>
                    </div>
                </div>
        );
    }
}