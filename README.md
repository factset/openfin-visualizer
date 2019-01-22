# OpenFin Visualizer

OpenFin Visualizer (OFV) serves as a tool for debugging and monitoring the OpenFin bus.
OFV is built on Electron and integrated with OpenFin. The purpose of OFV is to be useful
for Engineers and usable by non-technical users. Because of this, OFV is designed to behave
like a chat application with the offerings of the full scope of OpenFin functionality.

Notable features include:

* Selecting existing channels or specifying a runtime version
* Adding topics to monitor and publish to on the selected runtime
* A built-in JSON editor for easily modifying or creating JSON to publish to the bus
* The ability to export "conversations" and various info from a topic

## Development

The dev instance of OFV includes Chrome devtools for debugging the window and a
menu bar for easy access to Electron features. Electron runs and compiles concurrently
so there is a 10-second timeout before the browser window loads in order to give
Angular time to compile the appropriate resources.

### Preliminary

`npm install`

### Running

`npm run start`

## Production

The production instance of OFV is packaged via
[Electron Packager](https://github.com/electron-userland/electron-packager). Webpack
is used to initially compile and bundle the Electron resources while Angular's inherent
Webpack is used to compile and bundle the Angular-specific resources.

### Packaging

`npm run pack`
