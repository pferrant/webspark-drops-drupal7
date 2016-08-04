(function (callback) {
    if (typeof define === 'function' && define.amd) {
        define(['core/AbstractWidget'], callback);
    }
    else {
        callback();
    }
}(function () {

    (function ($) {

        /**
         * A pager widget for jQuery.
         *
         * <p>Heavily inspired by the Ruby on Rails will_paginate gem.</p>
         *
         * @expects this.target to be a list.
         * @class PagerWidget
         * @augments AjaxSolr.AbstractWidget
         * @todo Don't use the manager to send the request. Request only the results,
         * not the facets. Update only itself and the results widget.
         */
        AjaxSolr.asu_dirPagerWidget = AjaxSolr.PagerWidget.extend(
            /** @lends AjaxSolr.PagerWidget.prototype */
            {
                /**
                 *  We override this function to add a scroll to the top of the page after a page click
                 *
                 * @param {Number} page A page number.
                 * @returns {Function} The click handler for the page link.
                 */
                clickHandler: function (page) {
                    var self = this;
                    return function () {
                        self.manager.store.get('start').val((page - 1) * self.perPage());
                        self.doRequest();
                        window.scrollTo(0, 0);
                        return false;
                    }
                }
            });

    })(jQuery);

}));
