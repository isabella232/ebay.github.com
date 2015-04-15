(function () {
    var ALL_REPOS = "*";

    var ebay_projects = [
        { org: 'ebay',              repo: ALL_REPOS },
        { org: 'ebaysf',            repo: ALL_REPOS },
        { org: 'ebayopensource',    repo: ALL_REPOS },
        { org: 'raptorjs',          repo: ALL_REPOS },
        { org: 'ql-io',             repo: ALL_REPOS },
        { org: 'KylinOLAP',         repo: ALL_REPOS },
        { org: 'PulsarIO',          repo: ALL_REPOS },

        { org: 'appsforartists',    repo: 'ambidex' },
        { org: 'appsforartists',    repo: 'gravel' },
        { org: 'appsforartists',    repo: 'funx' },
        { org: 'timotheus',         repo: 'ebaysdk-python' },
        { org: 'ios-driver',        repo: 'ios-driver' },
        { org: 'ios-driver',        repo: 'libimobile-java' },
        { org: 'senthilp',          repo: 'spofcheck' },
        { org: 'selendroid',        repo: 'selendroid' }
    ];

    var ebay_team_by_github_org_name = {
        "appsforartists": {
            "name":     "eBay Mobile Innovations",
            "url":      "http://www.ebayenterprise.com/"
        },
        
        "paypal": {
            "name":     "PayPal",
            "url":      "https://www.paypal.com/"
        },
        
        "xcommerce": {
            "name":     "X.commerce",
            "url":      "https://www.paypal.com/"
        },
        
        "magento": {
            "name":     "Magento",
            "url":      "https://magento.com/"
        },
        
        "svpply": {
            "name":     "Svpply",
            "url":      "https://www.svpply.com/"
        },
        
        "selendroid": {
            "name":     "eBay European Product Development",
            "url":      "http://www.technology-ebay.de/"
        },
        
        "default": {
            "name":     "eBay Marketplaces",
            "url":      "http://www.ebay.com/"
        }
    };


    var specific_repos = ebay_projects.map(
        function (metadata) {
            return metadata.repo
        }
    ).filter(
        function (repo) {
            return repo !== ALL_REPOS
        }
    );
    
    var github_api_url = 'https://api.github.com/';
    var item_tmpl = $('#repo-item').html();
    var total_repos_div = $('#total-repos');
    var repos_div = $('#repos');
    var forked_from_tmpl = $('#forked-from').html();
    var forked_html = '';
    var members_div = $('#members');
    var query = '';
    var repos = [];
    var repos_results = [];
    var total_members = 0;

    var my = {

        updateResults: function() {
            total_repos_div.html(repos_results.length);
            repos_div.html(Mustache.to_html(item_tmpl, {repos: repos_results}));
        },

        dynamicSort: function(property) {
            var sortOrder = 1;
            if (property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1, property.length - 1);
            }
            return function (a,b) {
                var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            }
        },

        sortRepos: function(algorithm) {
            if (algorithm == undefined) algorithm = 1;
            //alert('sort: ' + algorithm);

            if (algorithm == 1 /* Most active */) {
                repos_results.sort(my.dynamicSort('-pushed_at_utime'));
            } else if (algorithm == 2 /* Activity: Number of forks */) {
                repos_results.sort(my.dynamicSort('-forks_count'));
            } else if (algorithm == 3 /* Activity: number of stars */) {
                repos_results.sort(my.dynamicSort('-watchers_count'));
            } else if (algorithm == 4 /* Time: creation date */) {
                repos_results.sort(my.dynamicSort('-created_at_utime'));
            } else if (algorithm == 5 /* Tech: programming language */) {
                repos_results.sort(my.dynamicSort('language'));
            }

            my.updateResults();
        },

        searchRegexpMatch: function(query) {
            //alert('searching for regexp matches: ' + query);
            for (var i = 0; i < repos_results.length; i++) {
                var re = new RegExp(query, 'i');
                if (repos_results[i].full_name.match(re) ||
                    repos_results[i].description.match(re)) {
                    continue;
                }

                repos_results.splice(i, 1);
                i--;
            }
        },

        searchRepos: function(query) {
            // If it's an empty query string, set it to match everything.
            if (query == '') {
                query = '.*';
            }
            //alert('search: ' + query);

            // Reset results to the full set by cloning the array, then filter.
            repos_results = repos.slice(0);
            
            this.searchRegexpMatch.call(this, query);
            this.sortRepos.call($('sort-select').val());
        },

        formatDate: function(date_string) {
            var month_names = new Array("January", "February", "March", "April",
                "May", "June", "July", "August", "September", "October",
                "November", "December");
            if (navigator.appName.indexOf("Microsoft") > -1) {
                // Modify the date string so it parses properly on IE.
                date_string = date_string.replace(/[-]/g, '/');
                date_string = date_string.replace(/([0-9])T([0-9])/g, '$1 $2');
                date_string = date_string.replace(/Z$/, '');
            }
            var d = new Date(date_string);
            return month_names[d.getMonth()] + ' ' + d.getDate() + ', ' +
                d.getFullYear() + ' ' + d.toLocaleTimeString();
        },

        processRepoResponse: function(repo, updateAfter2) {
            // Skip our own github pages web site repo(s).
            if (repo.name.match(/.github.(com|io)$/i)) return;

            repo.created_at = this.formatDate.call(this, repo.created_at);
            repo.pushed_at = this.formatDate.call(this, repo.pushed_at);
            repo.updated_at = this.formatDate.call(this, repo.updated_at);
            repo.created_at_utime = Math.round((new Date(repo.created_at)).getTime() / 1000);
            repo.updated_at_utime = Math.round((new Date(repo.updated_at)).getTime() / 1000);
            repo.pushed_at_utime = Math.round((new Date(repo.pushed_at)).getTime() / 1000);

            // Set an owner avatar image for the repo, default to an eBay logo.
            var eBayOrgAvatarUrl = window.location.href.replace(/index\.html/, "img/ebay-logo-new-large-gravatar.png");
            eBayOrgAvatarUrl = eBayOrgAvatarUrl.replace(/\/$/, "/img/ebay-logo-new-large-gravatar.png");
            repo.owner_avatar = repo.owner.avatar_url;
            repo.owner_avatar = repo.owner_avatar.replace(/d=.*/,
                "s=400&d=" + encodeURIComponent(eBayOrgAvatarUrl));


            repo.team_metadata = ebay_team_by_github_org_name[repo.owner.login] || ebay_team_by_github_org_name["default"];

            // If it's a fork, show where it was forked from.
            /*
            if (repo.fork == true) {
                forked_html = Mustache.to_html(forked_from_tmpl, {
                    fork_parent_org: repo.parent.owner.login,
                    fork_parent_org_url: repo.parent.owner.url,
                    fork_parent_name: repo.parent.name,
                    fork_parent_url: repo.parent.url
                });
                repo.forked_html = forked_html;

                /*
                $.ajax({
                    url: github_api_url + 'repos/' + org + '/' + repo + '/pulls',
                    dataType: 'jsonp',
                    success: function() {
                        repo.pulls_count = resp.data.length;
                    },
                    context: my
                });
                *\/
            }
            */

            repos.push(repo);

            if (updateAfter2 == true) {
                this.searchRepos.call(this, query);
            }
        },

        processRepoArrayResponse: function(data, updateAfter) {
            for (var i = 0; i < data.length; i++) {
                this.processRepoResponse.call(this, data[i], false);
            }

            if (updateAfter == true) {
                this.searchRepos.call(this, query);
            }
        },

        loadRepos: function(projects, updateAfter) {
            for (var i = 0; i < projects.length; i++) {
                var org = projects[i].org;
                var repo = projects[i].repo;
                if (repo === ALL_REPOS) {
                    $.ajax({
                        url: github_api_url + 'orgs/' + org + '/repos?access_token=f8da6e5dd69aa8693e273980455dabab0ea351dd&page=1&per_page=100',
                        dataType: 'jsonp',
                        cache: true,
                        success: function(response) {
                            if (response.data.length == undefined) {
                                repos_div.html("Github limits your API requests to 60 per hour, and you've exceeded that for this hour.  Try again in a bit..");
                            } else {
                                my.processRepoArrayResponse(
                                    /*  specific_repos are repos that aren't hosted in one of the eBay GitHub
                                     *  organizations.  Most likely, they are hosted on an employee's personal
                                     *  account, but copyrighted by the eBay Software Foundation.
                                     *
                                     *  This filter makes sure that we don't end up with two listings for a 
                                     *  single codebase (one for the master eBay org's copy and another for the
                                     *  the maintainer's personal copy).  It gives precedence to the more
                                     *  specific listing (e.g. the employee's).
                                     */

                                    response.data.filter(
                                        function (repo) {
                                            return specific_repos.indexOf(repo.name) === -1
                                        }
                                    ), 
                                    updateAfter
                                );
                            }
                        },
                        context: my
                    });
                } else {
                    $.ajax({
                        url: github_api_url + 'repos/' + org + '/' + repo + "?access_token=f8da6e5dd69aa8693e273980455dabab0ea351dd&page=1&per_page=100",
                        dataType: 'jsonp',
                        cache: true,
                        success: function(response) {
                            if (response.data.message != undefined) {
                                repos_div.html("Github limits your API requests to 60 per hour, and you've exceeded that for this hour.  Try again in a bit..");
                            } else {
                                my.processRepoResponse(response.data, updateAfter);
                            }
                        },
                        context: my
                    });
                }
            }
        },

        init: function() {
            this.loadRepos.call(this, ebay_projects, true);
        }
    };

    my.init();

    // When the user enters a search query, run the searchRepos() function.
    $('#search-query').change(function() {
        $.proxy(my.searchRepos, my, $('#search-query').val())();
    });

    // When the user selects a sort algorithm, run the sortRepos() function.
    $('#sort-select').change(function() {
        $('#sort-select').blur();
        $.proxy(my.sortRepos, my, $('#sort-select').val())();
    });
})();
