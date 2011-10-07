## What is this for? ##

This project will allow you to build and host your own instance of the MASCP GATOR.

## Building ##

### Dependencies ###

    npm install

### Configuring data sources ###

By default, GATOR will try to load data from the local server. If you don't want to do this, you need to unset the `MASCP.LOCALSERVER` variable in your html files. If you unset this, GATOR will request data from the original data sources all the time.

### Loading data from data dumps to host locally ###

It's possible to load up data directly from a data dump into the database for 
when you're trying to bootstrap your own install of GATOR

    curl --silent 'https://s3.amazonaws.com/gator-data/MASCP.TairReader.txt' | bin/data-manager.js --reader MASCP.TairReader
    curl --silent 'https://s3.amazonaws.com/gator-data/MASCP.SnpReader.txt' | bin/data-manager.js --reader MASCP.SnpReader
    curl --silent 'https://s3.amazonaws.com/gator-data/MASCP.InterproReader.txt' | bin/data-manager.js --reader MASCP.InterproReader
    
For more options for reading data dump files see

    bin/data-manager.js --help

### Hosting data ###

If you have your own dataset you wish to load into the GATOR, specify to load it with this command

    cat mydataset.csv | bin/load-csv.js --dataset 'MyDataset' --url 'http://example.com' --color '#ff0000'

For more options for loading data see

    bin/load-csv.js --help


## Running the server ##

You can fire up your GATOR server by running

    bin/gatordata-httpd
    
This will open up port 3000 on all interfaces

You can then access your local instance of GATOR at

    http://localhost:3000/

## Hacking ##

If you're hacking away on the server, you can take advantage of npm. You'll
need to check out the [mascp-jstools](https://github.com/hirenj/mascp-jstools/) repository somewhere.

    git clone git@github.com:hirenj/mascp-jstools.git gator
    cd gator
    npm install
    npm link
  
The npm link symlinks the development directory of mascp-jstools into the 
global package directory for npm. This means that any project that needs to
use mascp-jstools can use the development version. Then, in your gator-data directory, you can install the development version.

    cd gator-data
    npm link mascp-jstools
  
Whenever you make any changes to the library, rebuild it and restart the server.

## Hosting on EC2 ##

This project is based upon a template for EC2 hosting

- Less than 15 minutes from start to finish
- Eligible/compatible with the ["AWS Free Usage Tier"](http://aws.amazon.com/free/)
- Ubuntu Linux
- High-performance Nginx HTTP server
  - Sensible default configuration (three flavors to chose from)
  - Automatically handles all static file requests
  - Delegates non-static requests to the Node.js web server
- Git-based deployment
- Init.d scripts

This template enables a very smooth, simple and scalable workflow

- When developing locally, the single command `bin/gatordata-httpd` runs your web server and takes care of serving static files
- When deploying changes (after a git push), `gatordata-update restart` deploys changes and restarts services on your server
- Rolling back the server to an earlier version is a simple as `gatordata-update restart v0.1.2`

> Here's a guide on getting started with Amazon EC2: <http://rsms.me/2011/03/23/ec2-wep-app-template.html>

**Let's get started!** Head over to [INSTALL.md](https://github.com/hirenj/gator-data/blob/master/INSTALL.md#readme)

