import React from 'react'; 

import '../css/routingView.css';

// https://github.com/gfwilliams/svgtoeagle
import '../js/simplify.js';
import '../js/svgtoeagle.js';

import {download_script,convert} from '../js/svgtoeagle.js'

const controllerDim = {width: 45, height: 45}

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
        "12",
        "13",
    ],
    svgClickStates: {
        none: "NONE",
        button: "BUTTON",
        pin: "PIN"
    }
}

var transform;

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
            helpModalShown: false,
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
            toggleNextState: enums.svgClickStates.pin,

            pinName: null,
            btnName: null,
            convCoords: '',
            svg2eagle: '',
            previousMousePos: [],
            previousCursor: {x: 0, y:0}
          }; 

        //this.handleNextClick = this.handleNextClick.bind(this);
        
        // top menu interaction
        this.handleBackClick = this.handleBackClick.bind(this);
        this.handleStepClick = this.handleStepClick.bind(this); 

        // buttons and pins click
        this.handleButtonName = this.handleButtonName.bind(this);
        this.handlePinName = this.handlePinName.bind(this);
        this.handleDeleteButton = this.handleDeleteButton.bind(this);
        
        // SVG interaction 
        this.handlePinOrButtonPlacement = this.handlePinOrButtonPlacement.bind(this);
        this.handleSVGDown = this.handleSVGDown.bind(this);
        this.handleSVGUp = this.handleSVGUp.bind(this);
        this.escFunction = this.escFunction.bind(this);

        this.handleHelpButton = this.handleHelpButton.bind(this);

        // convert to eagle
        this.handleConvertClick = this.handleConvertClick.bind(this);
        this.handleConvertCoordsButton = this.handleConvertCoordsButton.bind(this);
        this.handleDownloadConvertedClick = this.handleDownloadConvertedClick.bind(this);
    }

    // on document load
    componentDidMount() {

        // pass react this to window for vanilla javascript to access it
        window.react_this = this;
        
        // init SVG point
        this.setState({pt: this.refs.mainSVG.createSVGPoint()});

        // attach ESC handler
        document.addEventListener("keydown", this.escFunction, false);
    }

    // on document unload
    componentWillUnmount() {
        // unattach ESC handler
        document.removeEventListener("keydown", this.escFunction, false);
    }

    // navigation
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

    // state helper functions
    handleUpdate(objects) {
        this.setState({objects});
    }

	handleStepClick(step) {  
		this.setState({ step:  step}); 
    } 

    handlePinName(pin) { 
        this.setState({pinName:pin})
    }
    
    handleButtonName(pin) { 
        this.setState({btnName:pin})
    } 

    /* HELPER: map coordinates in{min,max} => out{min,max} */
    scale = (num, in_min, in_max, out_min, out_max) => {
        /*console.log([
            num, in_min, in_max, out_min, out_max
        ]);*/
        return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

    // https://stackoverflow.com/a/1179377/665159
    strcmp_filter( str1, str2 )
    {
        return this.strcmp( str1, str2 ) == 0;
    }
    strcmp ( str1, str2 ) {
        // http://kevin.vanzonneveld.net
        // +   original by: Waldo Malqui Silva
        // +      input by: Steve Hilder
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +    revised by: gorthaur
        // *     example 1: strcmp( 'waldo', 'owald' );
        // *     returns 1: 1
        // *     example 2: strcmp( 'owald', 'waldo' );
        // *     returns 2: -1
    
        return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
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

    /* CONVERT CLICK - input & draw svg, convert to scr */
    handleConvertClick() {
        this.handleDeleteButton(-1);
        convert();
    }

    /* DOWNLOAD CLICK - download the entire script */
    handleDownloadConvertedClick() {
        download_script();
    }

    /* DELETE CLICK - delete connection */
    handleDeleteButton(index) {
        if ( index === -1 ) // delete all
        {
            this.setState({
                buttons: [],
                pins: []
            });
            return;
        }
        
        /*
        if ( this.state.toggleNextState === enums.svgClickStates.button ) {
            this.deleteLastPin();
            return;
        }*/
        
        
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
    deleteLastButton() {
        let newBtns = this.state.buttons;
        newBtns.pop();
        //let newPointIndex = this.state.pointIndex;
        //if ( newPointIndex <= 1 ) newPointIndex = 1;
        this.setState({
            toggleNextState: enums.svgClickStates.button,
            //pointIndex: newPointIndex - 1,
            buttons: newBtns
        });
    }
    deleteLastPin() {
        let newPins = this.state.pins;
        newPins.pop();
        let newPointIndex = this.state.pointIndex;
        if ( newPointIndex <= 1 ) newPointIndex = 1;
        this.setState({
            toggleNextState: enums.svgClickStates.pin,
            pointIndex: newPointIndex - 1,
            pins: newPins
        });
    }

    // handle esc function
    // https://stackoverflow.com/a/46123962/665159
    escFunction(event) {
        if(event.keyCode === 27) {
            // abort drawing if active
            if (this.state.toggleNextState === enums.svgClickStates.button) {
                this.deleteLastPin();
            }
        }
    }

    // ON CLICK on SVG - handle dragging, selection and clicking
    handleSVGDown(evt) {
        // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/

        var selectedElement = false;
        var currentMousePos = this.getMousePosition(evt);
        this.setState({"previousMousePos": this.getMousePosition(evt)});
        
        // clicking on canvas or one of the pin buttons
        if (
            this.state.toggleNextState == enums.svgClickStates.button ||
            evt.target.classList.contains('lily-pin')
        ) 
        {
            // clicked pin, get pin ID
            var pinID = (evt.target.getAttribute('data-pin-id') === null ) ? -1 : evt.target.getAttribute('data-pin-id');
            if ( pinID != -1 )
            {
                //this.state.pointIndex = +pinID;
                this.setState({pointIndex: +pinID});
                console.log([evt.target.getAttribute('data-pin'), pinID]);
            }
            else
            {
                // placing button, retain point ID from pin
                pinID = this.state.pointIndex;
            }
            // handle placing pin or button
            this.handlePinOrButtonPlacement(pinID, evt.target);
        } // single draggable element
        else if (evt.target.classList.contains('draggable')) 
        {
            selectedElement = evt.target;
            this.handleDragging(selectedElement, currentMousePos);
        } 
        // draggable group - controller image + pins
        else if (evt.target.parentNode.classList.contains('draggable-group')) 
        {
            selectedElement = evt.target.parentNode;
            this.handleDragging(selectedElement, currentMousePos);
        }
        this.setState({"selectedElement": selectedElement});
    }

    // handle dragging - generate initial transform to apply to any svg object
    handleDragging(selectedElement, offset)
    {
        // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
        selectedElement.classList.toggle("dragging");

        // Make sure the first transform on the element is a translate transform
        var transforms = selectedElement.transform.baseVal;

        if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
            // Create an transform that translates by (0, 0)
            var translate = this.refs.mainSVG.createSVGTransform();
            translate.setTranslate(0, 0);
            selectedElement.transform.baseVal.insertItemBefore(translate, 0);
        }

        // Get initial translation
        transform = transforms.getItem(0);
        offset.x -= transform.matrix.e;
        offset.y -= transform.matrix.f;

        this.setState({
            "offset": offset
        });
    }

    // let go of mouse - reset dragging 
    handleSVGUp(e) {
        // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
        if ( this.state.selectedElement )
        {
            this.state.selectedElement.classList.toggle("dragging");
        }
        this.setState({
            "selectedElement": false,
            "previousMousePos": {x: 0, y: 0}
        });
    }

    /* DRAWING CLICK - place button/pin */
    handlePinOrButtonPlacement(pinID, target) {

        let pointLabel = pinID + "";
        if ( pinID < enums.buttonsChosen.length )
        {
            pointLabel = enums.buttonsChosen[pinID];
        } 
        else 
        {
            pointLabel = "BTN" + (pinID - enums.buttonsChosen.length);
        }
        
        /*console.log([
            'CLICKED',
            [pinID + "/" + enums.buttonsChosen.length, this.state.toggleNextState]
        ]);*/
        

        switch (this.state.toggleNextState) {
            // JUST ADD POINTS
            default:
            case enums.svgClickStates.none:
                //console.log('something\'s ducky');
                //this.setState({toggleNextState: enums.svgClickStates.button});
                let newPoints = this.state.points.concat({
                    label: pointLabel, 
                    id: pinID,
                    x:this.state.dimensionX, 
                    y:this.state.dimensionY,
                    vectorX:this.state.absoluteX,
                    vectorY:this.state.absoluteY
                });
                
                this.setState({
                    points: newPoints,
                    pointIndex: pinID + 1
                });
                break;
            // ADD A BUTTON
            case enums.svgClickStates.button:
                let newButtons = this.state.buttons.concat({
                    label: pointLabel, 
                    id: pinID,
                    x:this.state.dimensionX, 
                    y:this.state.dimensionY,
                    vectorX:this.state.absoluteX,
                    vectorY:this.state.absoluteY
                });

                console.log(["ADDED BTN", {
                    label: pointLabel, 
                    id: pinID,
                    x:this.state.dimensionX, 
                    y:this.state.dimensionY,
                    vectorX:this.state.absoluteX,
                    vectorY:this.state.absoluteY
                }]);

                this.setState({
                    buttons: newButtons,
                    pointIndex: pinID + 1,
                    toggleNextState: enums.svgClickStates.pin
                }, this.handleConvertCoordsButton); // callback after setState completes

                break;
            
            // ADD A CONTROLLER PIN
            case enums.svgClickStates.pin:

                // get target bounding box
                var bbox = target.getBBox(),
                    middleX = bbox.x + (bbox.width / 2),
                    middleY = bbox.y + (bbox.height / 2);

                // add group translation to it
                var t = this.refs.pinGroup.getAttribute('transform');
                if ( t !== null )
                {
                    var parts  = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(t);
                    middleX += parseFloat(parts[1]);
                    middleY += parseFloat(parts[2]);
                }


                // new pins
                let newPins = this.state.pins.concat({
                    label: pointLabel, 
                    id: pinID,
                    x:middleX, 
                    y:middleY,
                    vectorX:this.state.absoluteX,
                    vectorY:this.state.absoluteY
                });

                console.log(["ADDED PIN", {
                    label: pointLabel, 
                    id: pinID,
                    x:middleX, 
                    y:middleY,
                    vectorX:this.state.absoluteX,
                    vectorY:this.state.absoluteY
                }]);
                
                this.setState({
                    pins: newPins,
                    //pointIndex: pinID + 1
                });
                this.setState({toggleNextState: enums.svgClickStates.button});
                break;
        }   
    }

    // calculate between SVG coordinate space and mouse coords
    getMousePosition(evt) {
        var CTM = this.refs.mainSVG.getScreenCTM();
        if (evt.touches) { evt = evt.touches[0]; }
        return {
            x: (evt.clientX - CTM.e) / CTM.a,
            y: (evt.clientY - CTM.f) / CTM.d
        };
    }

    // handle mouse move
    _onMouseMove(e) {
        /*let svgHeight = this.mainSVG.clientHeight;
        let svgWidth = this.mainSVG.clientWidth;

        let x = (e.nativeEvent.offsetX - 0) * (patternPixelDimension.width - 0) / (svgHeight - 0) + 0;
        let y =(e.nativeEvent.offsetY - 0) * (patternPixelDimension.height - 0) / (svgWidth - 0) + 0;
        */
        //console.log(e.target);

        var ptx = this.state.pt;
        ptx.x = e.clientX;
        ptx.y = e.clientY;
        this.setState({
            pt: ptx
        })
        
        // The cursor point, translated into svg coordinates
        var cursorpt =  ptx.matrixTransform(this.refs.mainSVG.getScreenCTM().inverse());
        let x = cursorpt.x;
        let y = cursorpt.y;

        // http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
        if ( this.state.selectedElement ) 
        {
            // calculate dx/dy for currently selected element (controller)
            var currentMousePos = this.getMousePosition(e);
            var off = this.state.offset; // initMousePos - initial element position
            var dx = currentMousePos.x - off.x;
            var dy = currentMousePos.y - off.y;
            transform.setTranslate(dx, dy);
            
            // calculate dx/dy from last frame
            var previousMousePos = this.state.previousMousePos;
            var pt_Derivative = {
                x: currentMousePos.x - previousMousePos.x, 
                y: currentMousePos.y - previousMousePos.y
            };

            //var currCursor = {x: x, y: y};
            var previousCursor = this.state.previousCursor;
            var px_Derivative = {
                x: cursorpt.x - previousCursor.x,
                y: cursorpt.y - previousCursor.y,
            };
            //this.setState({previousCursor: currCursor});
            
            let SVGBounds = this.refs.mainSVG.getBoundingClientRect();
            //console.log(this.refs.mainSVG.width + " x " + this.refs.mainSVG.height);
            let viewbox_parsed = this.refs.mainSVG.getAttribute("viewBox").split(" ").splice(-2, 2);
            // SVG CANVAS WIDTH AND HEIGHT
            viewbox_parsed = {
                x: +viewbox_parsed[0], 
                y: +viewbox_parsed[1]
            };

            console.log([
                "dX: " + px_Derivative.x,
                "dY: " + px_Derivative.y,


                "DX: " + pt_Derivative.x,
                "DY: " + pt_Derivative.y,
            ]);

            // apply dx/dy from last frame to all pins
            var pins_c = this.state.pins;
            for (let pinIndex = 0; pinIndex < pins_c.length; pinIndex++) {
                // only apply to coords, don't overwrite the whole pin
                var pin = pins_c[pinIndex];
                pin.x += pt_Derivative.x;
                pin.y += pt_Derivative.y;

                pin.vectorX += this.scale(pt_Derivative.x, 0, viewbox_parsed.x, 0,  SVGBounds.width);
                pin.vectorY += this.scale(pt_Derivative.y, 0, viewbox_parsed.y, 0, SVGBounds.height);

                pins_c[pinIndex] = pin;
            }
            this.setState({
                pins: pins_c,
                previousMousePos: currentMousePos,
                previousCursor: cursorpt
            });

            return;
        }

        // no selection, handle simple mouse move
        if (
            e.target.tagName.toLowerCase() !== 'svg' && 
            !["g", "svg"].includes( e.target.parentNode.tagName.toLowerCase() ) ) 
        { 
            return;
        }
        e.preventDefault();

        // https://stackoverflow.com/a/42183459/665159
        this.setState({ 
            absoluteX: e.nativeEvent.offsetX, 
            absoluteY: e.nativeEvent.offsetY,
            
            dimensionX: x,
            dimensionY: y
        });
        
    }

    // prepare EAGLE SCRIPT for adding controller pins to SCHEMATIC view
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

    // prepare EAGLE SCRIPT moving of button on BOARD view
    prepareMoveButtonPinString(index, btnX, btnY, pinX, pinY, btnName, pinName)
    {
        const moveCommand = "MOVE";
        const btnXY = "(" + btnX + " " + btnY + ")";
        const pinXY = "(" + pinX + " " + pinY + ")";
        const moveBtn = moveCommand + " " + btnName + " " + btnXY + ";\n";
        const movePin = moveCommand + " " + pinName + " " + pinXY + ";\n";
        return moveBtn + movePin;
    }

    // convert all coordinates
    handleConvertCoordsButton() {
        const NL = "\n";
        const editSchematic = "EDIT .SCH;" + "\n"; // switch to schematic view
        const editBoard = "EDIT .BRD;" + "\n"; // switch to board view
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
        // SVG CANVAS WIDTH AND HEIGHT
        // take the patternPixelDimension to scale it to the same size as it was before
        viewbox_parsed = {
            x: +viewbox_parsed[0],//patternPixelDimension.width,
            y: +viewbox_parsed[1]//patternPixelDimension.height
        };
        //console.log(viewbox_parsed);
        console.warn(this.state.pins);
        var pins = this.state.pins;
        var btns = this.state.buttons;
        var len = this.state.pins.length;
            for (let pinIndex = 0; pinIndex < len; pinIndex++) {
                let pin = pins[pinIndex];
                let btn = btns[pinIndex];

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

                console.log([
                    "analysing btn/pin pair: " + pin.id + " | " + btn.id,
                    pin,
                    btn
                ]);
                
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

    // assume inCoord is scaled to width = 100, height = 100
    // inCoord = 50, controllerDimension = 200
    // => return 100
    // inCoord = 50, controllerDimension = 50
    // => return 25
    convControllerCoords(inCoord, controllerDimension)
    {
        let inCoordPercent = inCoord / 100;
        return controllerDimension * inCoordPercent;
    }

    handleHelpButton()
    {
        var showModal = this.state.helpModalShown;
        if ( showModal === true )
        {
            showModal = false;
        }
        else
        {
            showModal = true;
        }
        this.setState({
            helpModalShown: showModal
        });

        document.body.classList.toggle("modal-open");
        document.getElementById("modalBackdrop").classList.toggle("show");
        document.getElementById("modalBackdrop").classList.toggle("display-none")
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
                                                //onMouseMove={this._onMouseMove.bind(this)}
                                                //onClick={this.handlePinOrButtonPlacement}
                                                //onLoad={this.handleSVGLoaded}
                                                onMouseMove={this._onMouseMove.bind(this)}
                                                onTouchMove={this._onMouseMove.bind(this)}

                                                onMouseDown={this.handleSVGDown}
                                                onTouchStart={this.handleSVGDown}

                                                onMouseUp={this.handleSVGUp}
                                                onMouseLeave={this.handleSVGUp}

                                                onTouchCancel={this.handleSVGUp}
                                                onTouchEnd={this.handleSVGUp}
                                                id="mainSVG"
                                                viewBox={`0 0 0 0`}
                                                >
{/*
                                                    <circle 
                                                        className="draggable" 
                                                        fill="#007bff" 
                                                        x="50" y="50" 
                                                        r="5"  
                                                        stroke="black" 
                                                        strokeWidth="0.5" 
                                                        />
*/}

                                                    <g width={controllerDim.width} height={controllerDim.height} className="draggable-group" ref="pinGroup">
                                                        <image 
                                                            xlinkHref={require('../img/lilypad.svg')} 
                                                            width={controllerDim.width} 
                                                            height={controllerDim.height} />
                                                        <circle 
                                                            cx={this.convControllerCoords(7,controllerDim.width)}
                                                            cy={this.convControllerCoords(44,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="GND"
                                                            data-pin-id="0"
                                                            >
                                                            <title>PIN_GND</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(7,controllerDim.width)}
                                                            cy={this.convControllerCoords(56,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="VOL"
                                                            data-pin-id="1"
                                                            >
                                                            <title>PIN_VOL</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(50,controllerDim.width)}
                                                            cy={this.convControllerCoords(7,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="RX"
                                                            data-pin-id="2"
                                                            >
                                                            <title>PIN_RX</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(38,controllerDim.width)}
                                                            cy={this.convControllerCoords(9,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="TX"
                                                            data-pin-id="3"
                                                            >
                                                            <title>PIN_TX</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(27,controllerDim.width)}
                                                            cy={this.convControllerCoords(14,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="2"
                                                            data-pin-id="10"
                                                            >
                                                            <title>PIN_2</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(17,controllerDim.width)}
                                                            cy={this.convControllerCoords(22,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="3"
                                                            data-pin-id="11"
                                                            >
                                                            <title>PIN_3</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(11,controllerDim.width)}
                                                            cy={this.convControllerCoords(32,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="4"
                                                            data-pin-id="12"
                                                            >
                                                            <title>PIN_4</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(11,controllerDim.width)}
                                                            cy={this.convControllerCoords(68,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="5"
                                                            data-pin-id="13"
                                                            >
                                                            <title>PIN_5</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(17,controllerDim.width)}
                                                            cy={this.convControllerCoords(78,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="6"
                                                            data-pin-id="14"
                                                            >
                                                            <title>PIN_6</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(27,controllerDim.width)}
                                                            cy={this.convControllerCoords(86,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="7"
                                                            data-pin-id="15"
                                                            >
                                                            <title>PIN_7</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(38,controllerDim.width)}
                                                            cy={this.convControllerCoords(92,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="8"
                                                            data-pin-id="16"
                                                            >
                                                            <title>PIN_8</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(50,controllerDim.width)}
                                                            cy={this.convControllerCoords(93,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="9"
                                                            data-pin-id="17"
                                                            >
                                                            <title>PIN_9</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(62,controllerDim.width)}
                                                            cy={this.convControllerCoords(91,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="10"
                                                            data-pin-id="18"
                                                            >
                                                            <title>PIN_10</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(74,controllerDim.width)}
                                                            cy={this.convControllerCoords(86,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="11"
                                                            data-pin-id="19"
                                                            >
                                                            <title>PIN_11</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(83,controllerDim.width)}
                                                            cy={this.convControllerCoords(78,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="12"
                                                            data-pin-id="20"
                                                            >
                                                            <title>PIN_12</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(89,controllerDim.width)}
                                                            cy={this.convControllerCoords(68,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="13"
                                                            data-pin-id="21"
                                                            >
                                                            <title>PIN_13</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(93,controllerDim.width)}
                                                            cy={this.convControllerCoords(56,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="A0"
                                                            data-pin-id="4"
                                                            >
                                                            <title>PIN_A0</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(93,controllerDim.width)}
                                                            cy={this.convControllerCoords(44,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="A1"
                                                            data-pin-id="5"
                                                            >
                                                            <title>PIN_A1</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(90,controllerDim.width)}
                                                            cy={this.convControllerCoords(32,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="A2"
                                                            data-pin-id="6"
                                                            >
                                                            <title>PIN_A2</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(83,controllerDim.width)}
                                                            cy={this.convControllerCoords(22,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="A3"
                                                            data-pin-id="7"
                                                            >
                                                            <title>PIN_A3</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(74,controllerDim.width)}
                                                            cy={this.convControllerCoords(14,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="A4"
                                                            data-pin-id="8"
                                                            >
                                                            <title>PIN_A4</title>
                                                        </circle>
                                                        <circle 
                                                            cx={this.convControllerCoords(62,controllerDim.width)}
                                                            cy={this.convControllerCoords(9,controllerDim.height)}
                                                            className="lily-pin"
                                                            data-pin="A5"
                                                            data-pin-id="9"
                                                            >
                                                            <title>PIN_A5</title>
                                                        </circle>
                                                    </g>
                                                    

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
                                                                <circle id={`button_${this.state.buttons[point].id}`}
                                                                        cx={this.state.buttons[point].x} 
                                                                        cy={this.state.buttons[point].y} 
                                                                        r="2"  
                                                                        stroke="orange" 
                                                                        strokeWidth="0.5"
                                                                        fill="#FF9900"
                                                                        className="point static button"
                                                                        onMouseEnter={() => this.handleButtonName(this.state.buttons[point].id)} 
                                                                        onMouseLeave={() => this.handleButtonName("")} 
                                                                >
                                                                    <title>[BTN] {enums.buttonsChosen[this.state.buttons[point].id]}</title>
                                                                </circle>
                                                        </React.Fragment>                          
                                                    ))}

                                                    {/*  CONTROLLER PINS  */}
                                                    {Object.keys(this.state.pins).map(point => (
                                                        <React.Fragment key={`point${point}`}> 
                                                                <circle id={`pin_${this.state.pins[point].id}`}
                                                                        cx={this.state.pins[point].x} 
                                                                        cy={this.state.pins[point].y} 
                                                                        r="2"  
                                                                        stroke="blue" 
                                                                        strokeWidth="0.5" 
                                                                        fill="#0060ff"
                                                                        className="point pin"
                                                                        onMouseEnter={() => this.handlePinName(this.state.pins[point].id)} 
                                                                        onMouseLeave={() => this.handlePinName("")} 
                                                                >
                                                                    <title>[PIN] {enums.buttonsChosen[this.state.pins[point].id]}</title>
                                                                </circle>
                                                        </React.Fragment>                          
                                                    ))}

                                                    {/* FOR EACH BUTTON THERE IS A PIN - CONNECT WITH LINE */}
                                                    {Object.keys(this.state.buttons).map(mapping => ( 
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
                                                     

                                                    {/* CURRENTLY DRAWING - CONNECT LAST PIN WITH DASHED LINE TO MOUSE POSITION */}
                                                    {( this.state.toggleNextState === enums.svgClickStates.button && this.state.pins.length > 0) ? 
                                                    
                                                        <React.Fragment key={`line${this.state.pins.length}`}>
                                                            <line 
                                                                x1={this.state.pins[this.state.pins.length-1].x} 
                                                                y1={this.state.pins[this.state.pins.length-1].y} 
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
                                                <span>Connections &nbsp;
                                                    <small className="text-muted">(
                                                        Controller <span className="blue dot">&#9679;</span> &rArr; 
                                                        Button <span className="orange dot">&#9679;</span>
                                                        )</small> 
                                                </span>
                                                &nbsp;
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
                                                {Object.keys(this.state.buttons).map(index => ( 
                                                    <React.Fragment key={`point${index}`}>
                                                        <div className="connection">
                                                            <small>
                                                                <span className="delete-x" onClick={() => this.handleDeleteButton(index)} title={`DELETE ${this.state.buttons[index].label}`}> X </span> &nbsp;
                                                                [{index}] &nbsp;
                                                                    <strong>{this.state.buttons[index].label}: </strong>
                                                                        <span className="blue dot">&#9679;</span> 
                                                                        <span className="blue dot">( {this.state.pins[index].vectorX.toFixed(1)} | {this.state.pins[index].vectorY.toFixed(1)} )</span>
                                                                    &nbsp; &rArr; &nbsp;
                                                                        <span className="orange dot">&#9679;</span> 
                                                                        <span className="orange dot">( {this.state.buttons[index].vectorX.toFixed(1)} | {this.state.buttons[index].vectorY.toFixed(1)} )</span> 


                                                                        
                                                                
                                                            </small>
                                                        </div>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>

                                
                                {/* HELP MODAL */}                            
                                <div className={ (this.state.helpModalShown === true) ? ("modal fade show display-block") : ("modal fade display-none")} id="exampleModal" role="dialog" aria-labelledby="exampleModalLabel">
                                    <div className="modal-dialog" role="document">
                                        <div className="modal-content">
                                            <div className="modal-header">
                                                <h5 className="modal-title" id="exampleModalLabel">
                                                    How to prepare SVG with the right options
                                                    <a href="https://github.com/gfwilliams/svgtoeagle">[REF]</a>
                                                    <sup>*)</sup>
                                                </h5>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-light" 
                                                    onClick={() => this.handleHelpButton()} 
                                                    aria-label="Close">
                                                <span aria-hidden="true">&times;</span>
                                                </button>
                                            </div>

                                            <div className="modal-body help-modal">
                                                <ul className="navbar-text">
                                                    <li>In Inkscape</li>
                                                    <ul className="navbar-text">
                                                        <li>File -&gt; Document Properties -&gt; Set correct document size in millimeters</li>
                                                        <li>Select all -&gt; Ungroup</li>
                                                        <li>Path -&gt; Object to path</li>
                                                        <li>Path -&gt; Break apart</li>
                                                        <li>Set a fill *or* a stroke set for every shape you want - items without a fill or a stroke won't be rendered</li>
                                                    </ul>
                                                    <li>Enter the layer to use in Eagle</li>
                                                    <li>Choose whether to flip the image horizontally or not</li>
                                                    <li>Click the 'Choose File' box below and upload your SVG</li>
                                                    <li>Place controller with pins and buttons</li>
                                                    <li>Copy contents of Textarea and Paste into Eagle CAD's command box</li>
                                                    <li><strong>OR:</strong> Download script and execute it via Eagle</li>
                                                </ul>

                                                <span>Normally copy/paste works fine, however for complex SVGs the commands become
                                                too big to paste into Eagle's command box. You'll need to click 'Download Eagle Script' 
                                                and then load that script in Eagle CAD.</span>
                                                <hr />
                                                <span><strong>Note:</strong> Filled polys with holes will show up in the preview as completely
                                                filled - but in Eagle the holes are kept.</span>
                                                <hr />
                                                <span><strong>Note:</strong> This tool assumes that 0,0 (the crosshair) is in the bottom left
                                                of your board in Eagle (which matches SVGs). If it isn't then the positioning of your graphics
                                                may be wrong.</span>
                                                <br />

                                                    <span className="text-muted">
                                                        <sup>*)</sup> <a href="https://github.com/gfwilliams/svgtoeagle">SVG to EAGLE by Gordon Williams</a>
                                                    </span>

                                                </div>

                                            <div className="modal-footer">
                                                <button type="button" className="btn btn-secondary" onClick={() => this.handleHelpButton()}>Close</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/*  CONFIG  */}      
                                <div className="col-md-4 order-md-1">
                                        <h4 className="mb-3 text-center">
                                            <span className="text-muted">Config</span>
                                            &nbsp; 
                                            <button type="button" className="btn btn-info btn-sm" onClick={() => this.handleHelpButton()} >
                                                How to use?
                                            </button>
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

                                        <div class="row">
                                            <div className="col-md-12 order-md-1 mb-4 pad-20">
                                                <button 
                                                    className="btn btn-primary btn-lg btn-block" 
                                                    onClick={this.handleConvertClick} >
                                                        1. Convert SVG to EAGLE
                                                    </button>
                                            </div>
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
                            
                                {/*
                            <div className="row md-3">
                                <div className="col-md-8 order-md-2 mb-4 pad-20">
                                    <button 
                                        className="btn btn-primary btn-block btn-lg btn-block" 
                                        onClick={() => this.handleConvertCoordsButton()}>
                                            2. Convert Connections
                                        </button>
                                </div>

                                
                            </div>          
                                */}
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
                                    2. Download eagle script
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