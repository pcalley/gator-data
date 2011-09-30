#!/usr/bin/env node
var argv =  require('optimist')
            .usage('Crawl data for a service\nUsage:\n $0 --reader [Service class] --idsource [Reader class, default MASCP.TairReader] --connections [num, default 10] --verbose')
            .demand(['reader'])
            .default('idsource','MASCP.TairReader')
            .default('connections','10')
            .argv;

MASCP = require('mascp-jstools');

var find_class = function(classname) {
    for (var reader_class in MASCP) { 
        if (MASCP.hasOwnProperty(reader_class) && classname == MASCP[reader_class].toString()) {
            return MASCP[reader_class];
        }
    }    
};

MASCP.events.once('ready',function() {
    var classname = argv.reader;
    var idclassname = argv.idsource || 'MASCP.TairReader';
    var crawl_clazz = find_class(classname);
    var id_clazz = find_class(idclassname);
    MASCP.Service.MAX_REQUESTS = parseInt(argv.connections) || 10;
    MASCP.Service.BeginCaching();
    var count = 0;
    MASCP.Service.CachedAgis(id_clazz,function(ids) {
        var current_set = [];

        // We don't like ANYTHING in the database, so we should get all new stuff
        MASCP.Service.SetMinimumAge(new Date());
        
        var total = ids.length;
        process.stdout.write("Retrieving data for "+classname+" running "+MASCP.Service.MAX_REQUESTS+" concurrent requests\n\n");
        setTimeout(function() {
            if (ids.length > 0 && current_set.length == 0) {
                current_set = ids.splice(0,MASCP.Service.MAX_REQUESTS);
                current_set.forEach(function(id) {
                    (new crawl_clazz().retrieve(id,function(err) {
                        count++;
                        process.stdout.write("\033[1A Processed: "+count+"/"+total+" ids\n");
                        current_set.shift();
                        if (err && argv.verbose) {
                            process.stderr.write("ERROR: "+id+" "+err+"\n");
                            return;
                        }
                        if (argv.verbose) {
                            process.stderr.write("RETRIEVED: "+id+"\n");
                        }
                    }));
                });
            }
            if (ids.length > 0) {
                setTimeout(arguments.callee,500);
            }
        },500);
    });
});
