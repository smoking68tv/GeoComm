ymaps.ready(init);

function init(){
    let myMap = new ymaps.Map("map", {
        center: [56.8375,60.5985],
        zoom: 13,
        controls: ['zoomControl']
    });
    let clusterer = new ymaps.Clusterer({
        gridSize: 128,
        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: true,
        clusterBalloonContentLayout: "cluster#balloonCarousel",
        clusterBalloonCycling: false,
        clusterOpenBalloonOnClick: true,
        clusterBalloonPanelMaxMapArea: 0
    });

    myMap.events.add('click', (e) => {  
        const coords = e.get('coords');
        
        ymaps.geocode(coords).then((res) => {
            let address = res.geoObjects.get(0).properties.get('text');
            console.log(coords)
            myMap.balloon.open(coords,{
                coords: coords,                    
                address: address,                   
                comment: ''
            },{
                layout: BalloonLayout,              
                contentLayout: BalloonContentLayout 
            });
        });
    });
    
    let BalloonLayout = ymaps.templateLayoutFactory.createClass(
        `<div id="pop-up" class="card container" style="width: 379px;">
            <div class="card-header row">
                <h5 class="card-title col-11">
                    {{properties.placemarkData.address|default: address}}
                </h5>
                <button id="closeButton" type="button" class="close col-1" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="card-body">
                <ul id="listComment" class="panel-references">                    
                </ul>
                <hr class="divider"></hr>
                <div class="form">
                    <h3>Ваш отзыв</h3>
                    <form action="" name="referencesForm">
                        <div class="form-group">
                            <input type="text" class="form-control" id="inputName" placeholder="Ваше имя">
                        </div>
                        <div class="form-group">
                            <input type="text" class="form-control" id="inputPlace" placeholder="Укажите место">
                        </div>
                        <div class="form-group">
                            <textarea class="form-control" id="controlComment" rows="3" placeholder="Поделитесь впечатлениями"></textarea>
                        </div>
                        <input id="addButton" type="submit" class="btn float-right" value="Добавить">
                    </form>
                </div>
            </div>
        </div>`,
        {
            build(){
                this.constructor.superclass.build.call(this);
                // console.log('build');
                let closeButton = document.querySelector('#closeButton'),
                addButton = document.querySelector('#addButton');
                addButton.addEventListener('click', this.createModelPoint.bind(this));
                closeButton.addEventListener('click',this.closeBalloon.bind(this));
            },
            clear(){
                this.constructor.superclass.clear.call(this);
                // console.log('clear');
                // let closeButton = document.querySelector('#closeButton'),
                // addButton = document.querySelector('#addButton');
                // addButton.removeListener('click', this.createModelPoint);
                // closeButton.removeListener('click', this.closeBalloon);
            },
            getShape() {
                return new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([ [0, 0], [380, 530] ]));
            },
            createModelPoint(e) {
                e.preventDefault();
                const name = document.querySelector('#inputName'),
                    place = document.querySelector('#inputPlace'),
                    comment = document.querySelector('#controlComment'),
                    listComment = document.querySelector('#listComment');
                console.log(this.getData())
                if(name.value !== '' && place.value !== '' && comment.value !== '') {
                    let placemark = {
                        name: name.value,
                        place: place.value,
                        comment: comment.value,
                        address: this.getData().address,
                        coords: this.getData().coords
                    }

                    myPlacemark = this.addPointOnMap.call(this, placemark);
                    clusterer.add(myPlacemark);
                    myMap.geoObjects.add(clusterer);
                }

            },
            closeBalloon(e) {
                this.events.fire('userclose');
            },
            addPointOnMap(placemark) {
                return new ymaps.Placemark(placemark.coords, {
                    placemarkData: placemark
                }, { 
                    balloonLayout: BalloonLayout,
                    balloonContentLayout: BalloonContentLayout,
                    balloonPanelMaxMapArea: 0 
                });
            }
            
        }
    ),
    BalloonContentLayout = ymaps.templateLayoutFactory.createClass(
     
    )
    
}
