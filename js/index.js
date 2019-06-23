ymaps.ready(init);

function init(){ 
    // Создание карты.    
    let myMap = new ymaps.Map("map", {
        center: [56.8375,60.5985],
        zoom: 13,
        controls: ['zoomControl']
    });

    myMap.events.add('click', async (e) => {
       
        const coords = e.get('coords');
        
        ymaps.geocode(coords).then((res) => {
            let address = res.geoObjects.get(0).properties.get('text');

        });
    });
    
}
