// Searches the body of the GitHub Issue for
// the main gantt chart elements. Each gantt chart
// element is on its own line in the main issue body.
function searchIssueBody(keywords, bodyText){
	const lines = bodyText.split('\r\n');
	var str = '';
	lines.forEach((line) => {
		if (line.includes(keywords)) {
			str = line;
			str = str.split(keywords)[1];
			str = str.replace(/\s/g, '');
		}
	});
	return str;
}

//Creates a unique ID for each GitHub issue.
//Because we're gathering issues across multiple 
//repos, the syntax of the id is:
// [repo name] + 'Issue #' + [GitHub issue number]
function getGanttID(repoName,issueNumber){
	var str = repoName + ' Issue #' + issueNumber;
	return str;
}

//Gets the task start date from the GitHub issue
//body. If it's missing from the body, create
//a start date based on the issue's date of creation.
//The start date should be entered in the GitHub main 
//issue text on a signle line as: 'Start Date: YYYY-MM-DD'
//TO DO - reformat the issue create date to YYYY-MM-DD.
function getGanttStartDate(bodyText, createDate) {
	var start = createDate; //default
	//var start = '2020-01-01'; // default
	var str = searchIssueBody('Start Date:', bodyText);
	if (str != null && str != '') {start = str;}
	return start;
}

//Gets the task end date from the GitHub issue
//body. The end date should be entered in the GitHub main 
//issue text on a single line as: 'End Date: YYYY-MM-DD'
//TO DO - check that the end date is
//later than the start date.
function getGanttEndDate(bodyText) {
	var end = '2020-12-31'; // default
	var str = searchIssueBody('End Date:', bodyText);
	if (str != null && str != '') {end = str;}
	return end;
}

//Gets the task completion percentage from the GitHub issue
//body. It should be entered in the GitHub main issue
// text on a single line, e.g., 'Progress (0-1): .75'
function getGanttProgress(bodyText) {
	var progress = 0; 
	var str = searchIssueBody('Progress (0-1):', bodyText);
	progress = str * 100;
	return progress;
}

//Gets any task dependencies from the GitHub issue
//body. It should be entered in the GitHub main issue
// text on a single line, e.g., 'Dependencies: #5,#20'
// (the numbers in the list of dependent items correspond 
// to the GitHub issue numbers)
function getGanttDependencies(bodyText, repoName) {
	var dependencies = '';
	var str = searchIssueBody('Dependencies:', bodyText);
	if (str != null && str != '') {
		dependencies = str.replace(/#/g, repoName + ' Issue #');
	}
	return dependencies;
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
					
					// Get the issue body
					// extract start date, end date, progress, dependencies
					// from the issue body
					tsvRow += '\t\'' + getGanttStartDate(data[i].body,data[i].created_at) +'\'';
					tsvRow += '\t\'' + getGanttEndDate(data[i].body) +'\'';
					tsvRow += '\t' + getGanttProgress(data[i].body);
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
function getRequest(repo, url, tasks, resolve, reject) {
	url = url + repo + "/issues";
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
					 'start': getGanttStartDate(data[i].body,data[i].created_at),
					 'end': getGanttEndDate(data[i].body),
					 'progress': getGanttProgress(data[i].body),
					 'dependencies': getGanttDependencies(data[i].body,repo),
					 //get the GitHub issue URL so we can link to it in the pop-up
					 'url': data[i].html_url,
					 //color code each repo's tasks
					 'custom_class': repo
				}];
				tasks.push(item[0]); 
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
		
	writeGanttDataFile();
	var tasks = [];

	//sent each call to each repo asynchronously and wait for them all to finish
	var promises = [];
	for(var i = 0; i < repos.length; i++) {
		var p = new Promise(function(resolve, reject){getRequest(repos[i], url, tasks, resolve, reject);});
		promises.push(p);
	}
	Promise.all(promises).then(function() {
		console.log('all promises executed');
		var gantt = new Gantt(".gantt-target", tasks, {
			//create a custom pop-up with the task URL
			custom_popup_html: function(task) {
				//TO DO: format start/end dates nicely
				//const start_date = task._start.format('MMM D');
				//const end_date = task._end.format('MMM D');
			  return `
				<div class="details-container">
				  <div class="title">${task.name}</div>
				  <div class="subtitle">
				  Start: ${task.start}<br />
				  End: ${task.end}<br />
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