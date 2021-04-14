/**
 * 
 */

var arcgis=procMap = {
		nodeSelected: function(nodeInfo, viewModel) {
			viewModel.title("Map");
			return new Promise(function(resolve, reject){
				resolve([]);
			});
		},
		getFolders: function(nodeInfo) {
			return new Promise(function(resolve, reject){
		        $.getJSON("./v1/equipments?parentID="+nodeInfo.equipmentId).
		        then(function(data){
		        	console.log(data)
		        	var d=data.equipmentList.map(function(e){
						return {
							id:e.id,
							children: true,
							text:e.name,
							data: {
								equipmentId: e.id,
								latitude: e.latitude,
								longitude: e.longitude,
								path: "/"
							}
						}
					});
					resolve(d);
				});
			})
		},
		loaded: function(nodeInfo) {
		}
};
