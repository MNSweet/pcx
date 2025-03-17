// /js/modules/helpers/Utils.js
Logger.file("Utils");

/**
 * Merges multiple option objects into one.
 * Later objects override properties from earlier ones.
 * @param {...Object} opts - Objects to merge.
 * @returns {Object} The merged object.
 */
function mergeOptsIntoDefaults(...opts) {
	return opts.reduce((acc, obj) => {
		if (typeof obj === 'object' && obj !== null) {
			return Object.assign({}, acc, obj);
		}
		return acc;
	}, {});
}

if (!Array.prototype.pushNew) {
  Array.prototype.pushNew = function(element) {
    if (!this.includes(element)) {
      this.push(element);
    }
  };
}
