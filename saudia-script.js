var casper = require('casper').create({
    verbose: true,
    logLevel: "debug",
    pageSettings: {
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0'
    }
});
casper.options.viewportSize = {width: 1301, height: 678};
casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
});

var fs = require('fs');
var utils = require('utils');

var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var orig = 'JED';
var dest = 'MED';
var fullorig = '', fulldest = '';
var journeyDateStr = '2017-03-25 14:00:00';
var dtParts = journeyDateStr.split(" ");
var datePart = dtParts[0];
var timePart = dtParts[1];
var dateParts = datePart.split("-");
var timeParts = timePart.split(":");

var year = dateParts[0];
var month = parseInt(dateParts[1]) - 1;
var day = dateParts[2];

var hour = timeParts[0];
var minute = timeParts[1];
var second = timeParts[2];

var stepOneComplete = false;

var journeyDate = new Date(year, month, day, hour, minute, second);

function mergedDate(dt)
{
	var hr = dt.getHours().toString();
	if(hr.length == 1)
	{
		hr = "0"+hr.toString();
	}
	var min = dt.getMinutes().toString();
	if(min.length == 1)
	{
		min = "0"+min.toString();
	}
	var month = (dt.getMonth()+1).toString();
	if(month.length == 1)
	{
		month = "0"+month.toString();
	}
	var day = dt.getDate().toString();
	if(day.length == 1)
	{
		day = "0"+day.toString();
	}
	return "" + dt.getFullYear() + month + day + hr + min;
}

function firstStep()
{
	casper.evaluate(function()
	{
		$('.ui--popup.ui--popup--standard:contains("Please note that you")').remove();
	});
	
	casper.evaluate(function()
	{
		$('#u__country--SA').click();
		$('#u__language--en').click();
		$('#language-dropdown-submit').click();
	});
	
	casper.wait(2000);
	
	casper.waitForSelector('#B_LOCATION_book', function success()
	{	
		casper.evaluate(function()
		{
			$('.ui--popup.ui--popup--standard:contains("Please note that you")').remove();
		});
		var citiesList = casper.evaluate(function()
		{
			return SaudiaLibrary.citiesList;
		
		});
		for(var i = 0; i < citiesList.length; i++)
		{
			var city = citiesList[i];
			if(city.cityKey == orig)
			{
				fullorig = city.value+" ("+orig+")";
			}
			if(city.cityKey == dest)
			{
				fulldest = city.value+" ("+dest+")";
			}
		}
	
		var fo = fullorig;
		var fd = fulldest;
		var o = orig;
		var d = dest;
		var t = mergedDate(journeyDate);
	
		casper.evaluate(function(fo, fd, o, d, t) {
			$('#B_LOCATION_book').val(fo);
			$('#E_LOCATION_book').val(fd);
			$('#B_LOCATION_availability').val(o);
			$('#E_LOCATION_availability').val(d);
			$("#u__book-trip-type--one-way").click();
			$("#adults").val('1');
			$('#cabin').val('E');
			$('#DATE_1').val(t);
			$('#DATE_2').val(t);
			$('#search-for-flights-go').click();
		}, fo, fd, o, d, t);
	}, function fail()
	{
		
	}, 5000);
	return true;
}

casper.on('remote.message', function(msg) {
    this.echo('remote message caught: ' + msg);
});

casper.start('http://www.saudia.com/');

casper.waitForSelector('#B_LOCATION_book', function success()
{
	stepOneComplete = firstStep();
}, function fail()
{
}, 5000);

if(stepOneComplete == false)
{
	casper.waitForSelector('select.cmb-country', function success()
	{
		this.evaluate(function()
		{
			//$('select.cmb-country').val('US');
			$('#lang').val('en');
		});
		this.click('.submit-bt input');
	}, function fail()
	{
	}, 5000);
}
	
if(stepOneComplete == false)
{
	casper.waitForSelector('#B_LOCATION_book', function success()
	{
		stepOneComplete = firstStep();
	}, function fail()
	{
	}, 5000);
}

casper.waitForSelector("form[id=OCUP_FORM]",
	function success() {
		this.capture("success.png");
	},
	function fail() {
		var html = this.getHTML();
		fs.write('failure.html', html, 'w+');
		this.capture("failure.png");
	}, 20000
);


casper.run();