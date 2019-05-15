# Smart Glove Maker

------------

Contributers: Nur Hamdan, **David Garica Olivares and Michal Slupczynski**

RWTH Aachen University, Germany

Funding:  EU and the state of NRW in Germany. Project 3D Competence Center // 3D-Kompetenzzentrum Niederrhein

Contact hamdan@cs.rwth-aachen.de

------------


The SGM is a web application that was developed to allow users with a limited technical background to create and program their own smart gloves.
The interfaces allow users to (1) design the glove, (2) connect it to electronics, (3) embroider it and assemble it, (4) program it. 

Step 1: Design
The user simply clicks on the illustrated hand to define the locations of the interactive buttons on the glove.

Step 2: Connect
The SGM communicates with Eagle PCB design software to optimize the routing of traces between the buttons and a central controller.

Step 3: Embroider
The SGM converts Eagle files to a stack of embroidery patterns. The user uses an embroidery machine to stitch the glove. She then follows assembly instructions on the SGM interface.

Step 4: Program
The user uses the SGM interface to program the glove. She selects an Action, e.g., play music, and demonstrates the associated gesture using the glove itself. The SGM generates the code and uploads it to the smart glove controller automatically.

