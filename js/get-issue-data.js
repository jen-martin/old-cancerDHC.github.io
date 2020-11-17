//Creates a unique ID for each GitHub issue.
//Because we're gathering issues across multiple 
//repos, the syntax of the id is:
// [repo name] + 'Issue #' + [GitHub issue number]
function getGanttID(repoName, issueNumber){
	var str = repoName + ' Issue #' + issueNumber;
	return str;
}

//Gets the task start or date from the GitHub issue
//milestone. Milestone should contain the phase (e.g., 
//"Phase 2") and quarter (e.g., "Quarter 2"). Note that 
//each phase starts in quarter 2 (5/1) and ends in
//quarter 1 of the next calendar year.
// opt = 0 gets the start date; opt = 1 gets the end date
function getGanttDate(milestone, opt) {
	var date = '';
	if (milestone != null) {
		if (milestone.title != null) {
			var str = milestone.title.toLowerCase();
			if (str.search("phase 2") >= 0) {
				if (opt == 0) {
					date = '2020-05-01'; // default is start of Phase 2
					if (str.search("quarter 2") >= 0 || str.search("q2") >= 0) {
						date = '2020-05-01';
					} else if (str.search("quarter 3") >= 0 || str.search("q3") >= 0) {
						date = '2020-08-01';
					} else if (str.search("quarter 4") >= 0 || str.search("q4") >= 0) {
						date = '2020-11-01';
					} else if (str.search("quarter 1") >= 0 || str.search("q1") >= 0) {
						date = '2021-02-01';
					}
				} else if (opt == 1) {
					date = '2021-04-30'; // default is end of Phase 2
					if (str.search("quarter 2") >= 0 || str.search("q2") >= 0) {
						date = '2020-07-31';
					} else if (str.search("quarter 3") >= 0 || str.search("q3") >= 0) {
						date = '2020-10-31';
					} else if (str.search("quarter 4") >= 0 || str.search("q4") >= 0) {
						date = '2021-01-31';
					} else if (str.search("quarter 1") >= 0 || str.search("q1") >= 0) {
						date = '2021-04-30';
					}
				}
			} else if (str.search("phase 3") >= 0) {
				if (opt == 0) {
					date = '2021-05-01'; // default is start of Phase 3
					if (str.search("quarter 2") >= 0 || str.search("q2") >= 0) {
						date = '2021-05-01';
					} else if (str.search("quarter 3") >= 0 || str.search("q3") >= 0) {
						date = '2021-08-01';
					} else if (str.search("quarter 4") >= 0 || str.search("q4") >= 0) {
						date = '2021-11-01';
					} else if (str.search("quarter 1") >= 0 || str.search("q1") >= 0) {
						date = '2022-02-01';
					}
				} else if (opt == 1) {
					date = '2022-04-30'; // default is end of Phase 3
					if (str.search("quarter 2") >= 0 || str.search("q2") >= 0) {
						date = '2021-07-31';
					} else if (str.search("quarter 3") >= 0 || str.search("q3") >= 0) {
						date = '2021-10-31';
					} else if (str.search("quarter 4") >= 0 || str.search("q4") >= 0) {
						date = '2022-01-31';
					} else if (str.search("quarter 1") >= 0 || str.search("q1") >= 0) {
						date = '2022-04-30';
					}
				}
			}
			return date;
		}
	}
}

// Gets the task phase
function getPhase(milestone, title) {
	var phase = '';
	if (milestone != null) {
		if (milestone.title != null) {
			var str = milestone.title.toLowerCase();
			if (str.search("phase 2") >= 0) {
				if (str.search("quarter 2") >= 0 || str.search("q2") >= 0) {
					phase = 'Phase 2.1';
				} else if (str.search("quarter 3") >= 0 || str.search("q3") >= 0) {
					phase = 'Phase 2.2';
				} else if (str.search("quarter 4") >= 0 || str.search("q4") >= 0) {
					phase = 'Phase 2.3';
				} else if (str.search("quarter 1") >= 0 || str.search("q1") >= 0) {
					phase = 'Phase 2.4';
				} else {
					phase = 'Phase 2.0';
				}
			}
		}
	} else {
		//infer phase from title if possible
	}
	return phase;
}

//Calculates the task completion percentage
function getGanttProgress(bodyText, status) {
	var progress = 0; 
	if (status.search("closed") >= 0) {
		progress = 100;
	} else if (status.search("open") >= 0) {
		var checked = 0;
		var unchecked = 0;
		var total = 0;
		//count number of open check boxes
		var patt = /- \[ \]/g;
	    if (patt.test(bodyText)) {
	    	var result1 = bodyText.match(patt);
	    	unchecked = result1.length;
	    }
		//count number of closed check boxes
		patt = /- \[x\]/g;
	    if (patt.test(bodyText)) {
	    	var result2 = bodyText.match(patt);
	    	checked = result2.length;
	    }
		// calculate percent complete
		total = checked + unchecked;
		if (total > 0) {
			progress = Math.round((checked / total) * 100);
		}
	}
	return progress;
}

//Gets any task dependencies from the GitHub issue
//body. Dependencies should be included in the body
//text using the hash symbol followed by the issue
//number (e.g., #19, #8)
function getGanttDependencies(bodyText, repoName) {
	var dependencies = '';
	//check if body text contains reference to another issue
	// (e.g., #19)
	var patt = /#\d+/g;
	if (patt.test(bodyText)) {
		var result = bodyText.match(patt);
		for(var i = 0; i < result.length; i++) {
			// Note that the syntax of the issue names is:
            // [repo name] + ' Issue # ' + [GitHub issue number]
			dependencies = dependencies + repoName + " Issue " + result[i];
			if (i < (result.length - 1)) {
				dependencies = dependencies + ", ";
			}
		};
	}
	return dependencies;
}

//determine the item's level from the title
//or label
function getParent(title, labels) {
	var parent = '';
	//first check title
	var str = title.trim().toLowerCase();
	str = str.split(' ')[0]; //get first "word" in the title
	var patt1 = /^\d[a-z]/; //starts with digit-letter
	var patt2 = /^\d[a-z]\d/; //starts with digit-letter-digit
	var patt3 = /^\d[a-z]\d[a-z]/; //starts with digit-letter-digit-letter
	if (patt1.test(str)) {
		//starts with digit-letter
		if (patt3.test(str)) {
			//starts with digit-letter-digit-letter
			parent = str.substring(0, 3);
		} else if (patt2.test(str)) {
			//starts with digit-letter-digit
			parent = str.substring(0, 2);
		} else {
			parent = str.substring(0, 1);
		}
	} else {
		// TO DO - try label
		
	}
	//console.log(title, labels, parent);
	return parent;
}


//sort tasks
function sortTasks(alltasks) {
	var sortedTasks = [];

	//calculate completion by Phase
	var phaseNames = ['Phase 1','Phase 2','Phase 3','Phase 4'];
	var phaseCompleteNum = [];
	var phaseCompleteDen = [];
	var phaseProgress = [];

	/* test -- sorting by parent
	var firstLevel = ['2a','2b','2c'];
	var secondLevel = ['2a1','2a2','2b1','2b2'];
	var secondLevelProgress = [0,0,0,0];
	var secondLevelNumerator = [0,0,0,0];
	var secondLevelDenominator = [0,0,0,0];
	var secondLevelHasChild = [0,0,0,0]; // TO DO - if the item doesn't have a child, use the item's percent complete as the progress

	for (var j = 0; j < secondLevel.length; j++) {
		var item = [];
		//defaults
		item.id = secondLevel[j];
		item.name = secondLevel[j];
		item.start = '2020-05-01';
		item.end = '2021-04-30';
		item.dependencies = '';
		item.url = '';
		item.custom_class = '';
		for (let i in alltasks) {
			//check to see if the item exits or needs to be created
			// calculate progress level
			var str = alltasks[i].parent;
			if (str != '') { 
				if (str == secondLevel[j]) {
					secondLevelNumerator[j] = secondLevelNumerator[j] + alltasks[i].progress;
					secondLevelDenominator[j] = secondLevelDenominator[j] + 100;
					secondLevelProgress[j] = Math.round((secondLevelNumerator[j] / secondLevelDenominator[j]) * 100);
					secondLevelHasChild[j] = secondLevelHasChild[j] + 1
					console.log(secondLevelNumerator[j],secondLevelDenominator[j],secondLevelProgress[j]);				
				}
			}
		}
		item.progress = secondLevelProgress[j];
		sortedTasks.push(item);
	}
	*/
	
	
	for (let i in alltasks) {
		item = [];
		item.id = alltasks[i].id;
		item.name = alltasks[i].name;
		item.start = alltasks[i].start;
		item.end = alltasks[i].end;
		item.dependencies = alltasks[i].dependencies;
		item.progress = alltasks[i].progress;
		//the GitHub issue URL to link to in the pop-up
		item.url = alltasks[i].url;
		//set the color code for the progress bar
		item.custom_class = alltasks[i].repo;
		item.phase = alltasks[i].phase;
		sortedTasks.push(item);
	}

	sortedTasks.sort((a, b) => (a.phase > b.phase) ? 1 : -1);
	return sortedTasks;
}


//Write all GitHub issues in all repos to a TSV file.
function writeGanttDataFile() {
	var tsvContent = 'id\ttitle\tstart_date\tend_date\tprogress\tdependencies\turl\n' ;
	const repos = ["community-development", "tools", "Terminology", "data-model-harmonization", "operations"];
		
	// For each repo, open a URL request, parse the issue data
	// and then go to the next repo
	var request = new XMLHttpRequest();
	(function loop(j, length) {
		if (j>= length) {
			// write to the file after all the issues are collected
			window.location.href = "data:text/tab-separated-values," + encodeURIComponent(tsvContent);
			return;
		}
		
		let repoName = repos[j];
		var url = "https://api.github.com/repos/cancerDHC/";
		url = url + repoName + "/issues";

		request.open("GET", url);
		request.onreadystatechange = function() {
			if(request.readyState === XMLHttpRequest.DONE && request.status === 200) {
				
				var data = JSON.parse(request.responseText);
				//Get data for each issue
				let tsvRow = '';
				for (let i in data) {
					
					// Create the Gantt Chart task id:
					// [repo name] + Issue # + [issue number]
					// Note that task dependencies reference this field.
					tsvRow = '\'' + getGanttID(repoName, data[i].number) + '\'';
					
					// Get the issue title
					tsvRow += '\t\'' + data[i].title +'\'';
					
					// Determine the start and end dates from the issue milestone
					tsvRow += '\t\'' + getGanttDate(data[i].milestone, 0) +'\''; //start date
					tsvRow += '\t\'' + getGanttDate(data[i].milestone, 1) +'\''; //end date

					// TO DO - Determine Progress completed
					tsvRow += '\t' + getGanttProgress(data[i].body, data[i].state);

					//Extract any dependencies from the issue body
					tsvRow += '\t\'' + getGanttDependencies(data[i].body, repoName) +'\'';
					// Log the repo url
					tsvRow += '\t' + data[i].html_url + '\n';
			
					tsvContent += tsvRow;
				}
				
				// go to next repo
				loop(j + 1, length);
			}
		}
		request.send();
		
	})(0, repos.length);
};

// Sends the GitHub API request for a particular repo, 
// parses the response, and creates a gantt chart object
// to display the information.
// TO DO: add custom formatting of bars based on repo; see
// https://github.com/frappe/gantt/issues/175 for implementation.
// NOTE: If a repo has more than 100 issues, will need to get multiple 
// "pages" of data.
function getRequest(repo, url, alltasks, resolve, reject) {
	url = url + repo + "/issues?state=all&per_page=100"; //gets all issues, up to 100
	console.log("Sending request to get data: " + url);
	  var xhttp;
	  if (window.XMLHttpRequest) {
		// code for modern browsers
		xhttp = new XMLHttpRequest();
	  } else {
		// code for IE6, IE5
		xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	  }
	  xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var data = JSON.parse(xhttp.responseText);
			// Create a gantt chart task for each issue in the repo.
			// Syntax: https://frappe.io/gantt
			for (let i in data) {
				var item = [
				{
					 'id': getGanttID(repo, data[i].number),
					 'name': data[i].title,
					 'start': getGanttDate(data[i].milestone, 0),
					 'end': getGanttDate(data[i].milestone, 1),
					 'progress': getGanttProgress(data[i].body, data[i].state),
					 'dependencies': getGanttDependencies(data[i].body,repo),
					 //get the GitHub issue URL so we can link to it in the pop-up
					 'url': data[i].html_url,
					 //repo name
					 'repo': repo,
					 //parent item
					 'parent': getParent(data[i].title, data[i].labels),
					 //project phase
					 'phase': getPhase(data[i].milestone, data[i].title),
				}];
				alltasks.push(item[0]); 
			}
		  
		  return resolve();
		} 
	  };
	  xhttp.open("GET", url, true);
	  xhttp.send();
}

function createTasks() {
	//This is the base GitHub API URL for the CCDH group
	var url = "https://api.github.com/repos/cancerDHC/";
	//var url = "https://api.github.com/repos/jen-martin/"; //test
	
	// These are the GitHub repo names to get issues from
	var repos = ["community-development", "tools", "Terminology", "data-model-harmonization", "operations"];
	//var repos = ["test-gantt", "jen-martin.github.io"]; //test
		
	//writeGanttDataFile();
	var alltasks = [];

	//sent each call to each repo asynchronously and wait for them all to finish
	var promises = [];
	for(var i = 0; i < repos.length; i++) {
		var p = new Promise(function(resolve, reject){getRequest(repos[i], url, alltasks, resolve, reject);});
		promises.push(p);
	}
	Promise.all(promises).then(function() {
		console.log('all promises executed');
		//console.log(alltasks);

		var tasks = sortTasks(alltasks); 
		console.log(tasks);

		var gantt = new Gantt(".gantt-target", tasks, {
			//create a custom pop-up with the task URL
			custom_popup_html: function(task) {
			  return `
				<div class="details-container">
				  <div class="title">${task.name}</div>
				  <div class="subtitle">
				  Due: ${task.end} &nbsp;&nbsp;&nbsp;&nbsp; ${task.progress}% Complete<br />
				  <a href=${task.url} target="_blank">${task.url}</a>
				  </div>
				</div>
			  `;
			}
		});
		//sets the default view mode
		gantt.change_view_mode('Year');
		
		//change view mode dynamically
		$(function() {
			$(".btn-group").on("click", "button", function() {
				$btn = $(this);
				var mode = $btn.text();
				gantt.change_view_mode(mode);
				$btn.parent().find('button').removeClass('active');
				$btn.addClass('active');
			});
		});
		
		
		//console.log(tasks);
	});	
}
createTasks();
