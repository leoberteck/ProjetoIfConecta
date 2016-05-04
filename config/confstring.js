/*adiciona para o prototype da class String
 * para permitir o uma functionalidadte semelhante 
 * ao metodo 'format' presente no .net
 * exemplo : 
 * '{0} é um {1}'.format('isso', 'exemplo') = "isso é um exemplo"
*/
module.exports.config = function (){
    if (!String.prototype.format) {
        String.prototype.format = function () {
            var args = arguments;
            return this.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined'
        ? args[number]
        : match
                ;
            });
        };
    }
}