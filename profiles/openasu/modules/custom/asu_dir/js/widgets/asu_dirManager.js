/**
 * Created by ctestama on 4/21/16.
 */




/**
 * The Manager acts as the controller in a Model-View-Controller framework. All
 * public calls should be performed on the manager object.
 *
 * @param properties A map of fields to set. Refer to the list of public fields.
 * @class AbstractManager
 */
(function (callback) {
    if (typeof define === 'function' && define.amd) {
        define(['core/AbstractManager'], callback);
    }
    else {
        callback();
    }
}(function () {


    /**
     * @see http://wiki.apache.org/solr/SolJSON#JSON_specific_parameters
     * @class Manager
     * @augments AjaxSolr.AbstractManager
     */
    AjaxSolr.asu_dirManager = AjaxSolr.AbstractManager.extend(
        /** @lends AjaxSolr.Manager.prototype */
        {
            /**
             * @param {Object} [attributes]
             * @param {Number} [attributes.start] This widget will by default set the
             *   offset parameter to 0 on each request.
             */
            constructor: function (attributes) {
                AjaxSolr.asu_dirManager.__super__.constructor.apply(this, arguments);
                AjaxSolr.extend(this, {
                    field_configs: null,
                    sorted_people: {},
                    sorted_response: {},
                    override_fields: []
                }, attributes);
            },

            executeRequest: function (servlet, string, handler, errorHandler) {
                var self = this,
                    options = {dataType: 'json'};
                var fq = self.store.get('fq');
                var q = self.store.get('q');
                var override = false;
                var override_fields = self.override_fields;

                var field_configs = self.field_configs;
                string = string || this.store.string();
                handler = handler || function (data) {
                        self.handleResponse(data);
                    };
                errorHandler = errorHandler || function (jqXHR, textStatus, errorThrown) {
                        self.handleError(textStatus + ', ' + errorThrown);
                    };
                if (this.proxyUrl) {
                    options.url = this.proxyUrl;
                    options.data = {query: string};
                    options.type = 'POST';
                }
                else {
                    options.url = this.solrUrl + servlet + '?' + string + '&wt=json&json.wrf=?';
                }


                //if an override field is found as an fq, override the manager query
                for (var i = 0; i < fq.length; i++) {
                    for (var j = 0; j < override_fields.length; j++) {

                        if (fq[i] != null && fq[i].value != null && fq[i].value.indexOf(override_fields[j]) != -1) {
                            override = true;
                        }
                    }
                }

                if (q.value != "*:*") {
                    override = true;
                }

                // If we are using our custom manager sort, then we need to check if we already have a sorted array,
                // or need to grab and sort from Solr
                if (field_configs.show_managers && !override) {

                    //get the start parameter, if it exists.  we need this for
                    //pagination of results
                    var start = 0;
                    if (self.store.params.start.value != undefined) {
                        start = self.store.params.start.value;
                    }

                    // if we have not set sorted people for the current dept.
                    if (self.sorted_people[ASUPeople.dept_nid] == null) {
                        // grab all of the results and start from the beginning
                        // we'll need to sort all results as a group
                        options.url = options.url + "&rows=2000";

                        var rep = /(start=).*?(&)/gi;

                        options.url = options.url.replace(rep, "start=0&");
                        var managers = [];

                        jQuery.ajax(options).done(function (data) {

                            var docs = data.response.docs;

                            for (var i = 0; i < docs.length; i++) {
                                var temp = docs[i];
                                var search = ASUPeople.dept_nid.toString();
                                var position = temp.deptids.indexOf(search);

                                if (position >= 0) {
                                    //if person is not a manager of given department, add index to the to_remove array for later removal
                                    if (temp.managers[position] == 1) {
                                        managers.push(temp);
                                        docs.splice(i, 1);
                                    }
                                }
                            }

                            if (managers.length != 0) {
                                for (var i= managers.length - 1; i >= 0; i--) {
                                    docs.unshift(managers[i]);
                                }
                            }

                            //maintain a complete array of sorted results for the dept.
                            self.sorted_people[ASUPeople.dept_nid] = docs;

                            //substitute the proper page of the array
                            var pag_results = self.sorted_people[ASUPeople.dept_nid].slice(start, start + 10);

                            data.response.docs = pag_results;
                            self.sorted_response[ASUPeople.dept_nid] = data;

                            self.handleResponse(data);

                        }).fail(errorHandler);
                    } else {
                        var data = self.sorted_response[ASUPeople.dept_nid];
                        var pag_results = self.sorted_people[ASUPeople.dept_nid].slice(start, start + 10);
                        data.response.docs = pag_results;
                        //self.sorted_response[ASUPeople.dept_nid] = data;
                        self.handleResponse(data);
                    }

                } else {
                    jQuery.ajax(options).done(handler).fail(errorHandler);
                }
            }
        });

}));