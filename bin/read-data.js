#!/usr/bin/env node

/*
File format should be

IDENTIFIER,{ ... JSON ...}
IDENTIFIER,{ ... JSON ...}

In UTF8 format

*/




var argv =  require('optimist')
            .usage('Load data into the cache\nUsage: $0 --file [file] --reader [Reader class] --date YYYY/MM/DD')
            .demand(['file','reader'])
            .argv;

var tools = require('../gator/script_tools.js');
var events = require('events'),
    fs = require('fs'),
    sys = require('sys');

var read_csv = function(filename) {
        var lines = fs.readFileSync(filename,"utf8").split("\n");
        var data = [];
        for (var i = lines.length - 1; i >= 0; i-- ) {
            data.push(lines[i].split(/,(.+)/));
        }
        return data.reverse();
    };

MASCP = require('../gator/dist/js/maschup.services.js');
MASCP.events.once('ready',function() {
    var date = argv.date ? new Date(Date.parse(argv.date + " 0:00 GMT")) : new Date();
    var classname = argv.reader;
    var data = read_csv(argv.file);
    var current_agi = data[0][0];
    var retrieve_func = function(agi,cback) {
        if (data.length > 0) {
            var row = data.shift();
            var data_block = JSON.parse(row[1]);
            data_block.retrieved = date;
            this.agi = row[0];
            current_agi = this.agi;
            this._dataReceived(data_block);
        }
    };
    
    for (var reader_class in MASCP) { 
        if (MASCP.hasOwnProperty(reader_class) && classname == MASCP[reader_class].toString()) {
            console.log("Reading in "+argv.file+" for "+classname+" setting timestamp to "+date);
            var clazz = MASCP[reader_class];
            var reader = new clazz();
            reader.retrieve = retrieve_func;
            MASCP.Service.CacheService(reader);
            MASCP.Service.SetMinimumAge(new Date());
            reader.retrieve(current_agi, function() {
                if (data.length > 0) {
                    this.retrieve(current_agi,arguments.callee);
                }
            });
        }
    }
});