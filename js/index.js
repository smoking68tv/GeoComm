commentHbs = require('../hbs/comment.hbs');
ymaps.ready(init);

function init(){
    let myMap = new ymaps.Map("map", {
        center: [56.8375,60.5985],
        zoom: 13,
        controls: ['zoomControl']
    });
    myMap.events.add('click', (e) => {  
        const coords = e.get('coords');
        
        ymaps.geocode(coords).then((res) => {
            let address = res.geoObjects.get(0).properties.get('text');
            myMap.balloon.open(coords,{
                coords,                    
                address,                   
                comment: 'Отзывов нет'
            },{
                layout: BalloonLayout,              
                contentLayout: BalloonContentLayout 
            });
            console.log(myMap.balloon.getOptions())
        });
    });

    let placemarks = []; 
    
    let BalloonLayout = ymaps.templateLayoutFactory.createClass(
        `<div id="pop-up" class="card container" style="width: 379px; max-height: 527px">
            <div class="card-header row">
                <h5 class="card-title col-11">
                    {{properties.placemarkData.address|default: address}}
                </h5>
                <button id="closeButton" type="button" class="close col-1" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="card-body">
                <ul id="listComment" style="max-height: 100px; overflow: auto;">
                    {% include options.contentLayout %}
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

                let closeButton = document.querySelector('#closeButton'),
                addButton = document.querySelector('#addButton');

                addButton.addEventListener('click', this.createModelPoint.bind(this));
                closeButton.addEventListener('click',this.closeBalloon.bind(this));
            },
            clear(){
                this.constructor.superclass.clear.call(this);
                // let closeButton = document.querySelector('#closeButton'),
                // addButton = document.querySelector('#addButton');
                // addButton.removeEventListener('click', this.createModelPoint);
                // closeButton.removeEventListener('click', this.closeBalloon);
            },
            closeBalloon(e) {
                this.events.fire('userclose');
            },
            getShape() {
                return new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([[0, 0], [380, 530]]));
            },
            createModelPoint(e) {
                e.preventDefault();
                
                const name = document.querySelector('#inputName'),
                    place = document.querySelector('#inputPlace'),
                    comment = document.querySelector('#controlComment'),
                    listComment = document.querySelector('#listComment');
                

                if(name.value && place.value && comment.value) {
                    placemarks.push ({
                        name: name.value,
                        place: place.value,
                        comment: comment.value,
                        address: this.getData().properties ? this.getData().properties.getAll().placemarkData.address : this.getData().address,
                        coords: this.getData().properties ? this.getData().properties.getAll().placemarkData.coords : this.getData().coords
                    });
                    
                    listComment.firstElementChild.firstElementChild.firstElementChild ? 
                    listComment.firstElementChild.firstElementChild.innerHTML += commentHbs({name: name.value, place: place.value, comment: comment.value,})
                        : listComment.firstElementChild.firstElementChild.innerHTML = commentHbs({name: name.value, place: place.value, comment: comment.value,});
                    
                    let myPlacemark = this.addPointOnMap.call(this, placemarks[placemarks.length - 1]);

                    clusterer.add(myPlacemark);
                    myMap.geoObjects.add(clusterer);
                    name.value = place.value = comment.value = '';
                }

            },
            addPointOnMap(placemark) {
                return new ymaps.Placemark(placemark.coords, {
                    placemarkData: placemark
                }, { 
                    balloonLayout: BalloonLayout,
                    balloonContentLayout: BalloonContentLayout,
                    balloonPanelMaxMapArea: 0,
                    visible: true
                });
            },
        }
    ),
    BalloonContentLayout = ymaps.templateLayoutFactory.createClass(
        `{% if properties.placemarkData %}
            <li class="comment-item">
                <span class="name">{{properties.placemarkData.name}},</span>
                <span class="place">{{properties.placemarkData.place}},</span>
                <div class="comment-text">{{properties.placemarkData.comment}}</div>
            </li>
        {% endif %}
        {% if comment %}
            {{comment | raw}}
        {% endif %}`
    ),
    customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        `<div class="cluster-balloon">
            <h2 class="cluster-balloon-header">{{properties.placemarkData.place}}</h2>
            <a href="#" id="address">{{properties.placemarkData.address}}</a>
            <div class="cluster-balloon-body">{{properties.placemarkData.comment}}</div>
            <div class="cluster-balloon-footer">{{properties.placemarkData.date}}</div>
        </div>`,
        {
            build(){
                this.constructor.superclass.build.call(this);
                let address = document.querySelector('#address');
                address.addEventListener('click', this.clickOnAddress.bind(this));
            },
            clear(){
                // let link = document.querySelector('#addressLink');
                // link.removeEventListener('click', this.onLinkClick);
                this.constructor.superclass.clear.call(this);
            },
            clickOnAddress(e){
                e.preventDefault();
                let coords = this.getData().properties.getAll().placemarkData.coords,
                    address = this.getData().properties.getAll().placemarkData.address,
                    foundPlacemarks = [];
                    for (let point in placemarks) {
                        if (placemarks[point].address === this.getData().properties.getAll().placemarkData.address) {
                            foundPlacemarks.push(placemarks[point]); 
                        }
                    }
                    
                myMap.balloon.open(coords,{
                    coords,
                    address,
                    comment: this.render(foundPlacemarks)
                    
                },{
                    layout: BalloonLayout,
                    contentLayout: BalloonContentLayout
                });
                this.events.fire('userclose');
            },
            render(foundPlacemarks) {
                let span = document.createElement('span')
                for(let comment of foundPlacemarks) {
                    span.innerHTML += commentHbs({name: comment.name, place: comment.place, comment: comment.comment});
                }  
                return span.innerHTML;
            }
        }
    );
    let clusterer = new ymaps.Clusterer({
        gridSize: 64,
        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: true,
        clusterBalloonContentLayout: "cluster#balloonCarousel",
        clusterBalloonCycling: false,
        clusterOpenBalloonOnClick: true,
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonItemContentLayout: customItemContentLayout,
    });
}
