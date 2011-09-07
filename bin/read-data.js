#!/usr/bin/env node

/*
File format should be

IDENTIFIER,{ ... JSON ...}
IDENTIFIER,{ ... JSON ...}

In UTF8 format

*/




var argv =  require('optimist')
            .usage('Load data into the cache\nUsage:\n cat [file] | $0 --reader [Reader class] --date YYYY/MM/DD \nOR\n $0 --file [file] --reader [Reader class] --date YYYY/MM/DD\n\nFor large data loading, use the pipe format, which runs a lot faster.')
            .demand(['reader'])
            .argv;

var tools = require('../gator/script_tools.js');
var events = require('events'),
    fs = require('fs'),
    carrier = require('carrier'),
    sys = require('sys');

var read_csv = function(filename) {
        var lines = fs.readFileSync(filename,"utf8").split("\n");
        var data = [];
        for (var i = lines.length - 1; i >= 0; i-- ) {
            data.push(lines[i].split(/,(.+)/));
        }
        return data.reverse();
};

var get_stdin = function(cback,endcback) {
    process.stdin.resume();
    process.stdin.on('end',function() {
        endcback();
    });
    carrier.carry(process.stdin,function(line) {
        cback.call(null,line.split(/,(.+)/));
    })
};

MASCP = require('../gator/dist/js/maschup.services.js');
MASCP.events.once('ready',function() {
    var date = argv.date ? new Date(Date.parse(argv.date + " 0:00 GMT")) : new Date();
    var classname = argv.reader;
    var current_agi = null;
    var current_data = null;
    var retrieve_func = function(agi,cback) {
        var data_block = JSON.parse(current_data);
        data_block.retrieved = date;
        this.agi = current_agi;
        current_agi = this.agi;
//        this._dataReceived({});
//        this._dataReceived(current_data);
        this._dataReceived(data_block);
        data_block = {};
        cback.call(this);
    };
    
    for (var reader_class in MASCP) { 
        if (MASCP.hasOwnProperty(reader_class) && classname == MASCP[reader_class].toString()) {

            var clazz = MASCP[reader_class];
            var reader;
            var make_new_reader = function() {
                var rdr = new clazz();
                rdr.retrieve = retrieve_func;
                rdr._dataReceived = function() {
                };
                MASCP.Service.CacheService(rdr);
                return rdr;
            }
            
            reader = make_new_reader();
            
            MASCP.Service.SetMinimumAge(new Date());
            var end_func = MASCP.Service.BulkOperation();
            if (argv.file) {
                var data = read_csv(argv.file);
                var row = data.shift();
                current_agi = row[0];
                current_data = row[1];
                reader.retrieve(current_agi, function() {
                    if (data.length > 0) {
                        row = data.shift();
                        current_agi = row[0];
                        current_data = row[1];
                        this.retrieve(current_agi,arguments.callee);
                    } else if (data.length == 0) {
                        end_func();
                    }
                });
            } else {
                get_stdin(function(line) {
                    current_agi = line[0];
                    current_data = line[1];
                    reader.retrieve(line[0], function() { });
                }, function() {
                    end_func();
                });
            }
            
            console.log("Reading in "+argv.file+" for "+classname+" setting timestamp to "+date);
        }
    }
});