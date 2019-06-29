const commentHbs = require('../hbs/comment.hbs');
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
                comment: 'Отзывов пока нет...'
            },{
                layout: BalloonLayout,              
                contentLayout: BalloonContentLayout 
            });
        });
    });

    let placemarks = []; // Все маркеры на карте
    
    let BalloonLayout = ymaps.templateLayoutFactory.createClass(
        `<div id="pop-up" class="card container">
            <div class="card-header row align-center">
                <h3 class="card-title col-11">
                    {{properties.placemarkData.address|default: address}}
                </h3>
                <button id="closeButton" type="button" class="close col-1" aria-label="Close">
                    <span aria-hidden="true" class=" text-center">&times;</span>
                </button>
            </div>
            <div class="card-body">
                <ul id="listComment">
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
                        <div class="form-group">
                            <input id="addButton" type="submit" class="btn float-right" value="Добавить">
                        </div>
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
                let closeButton = document.querySelector('#closeButton'),
                addButton = document.querySelector('#addButton');

                addButton.removeEventListener('click', this.createModelPoint);
                closeButton.removeEventListener('click', this.closeBalloon);

                this.constructor.superclass.clear.call(this);
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
                        date: this.createDate(new Date()),
                        comment: comment.value,
                        address: this.getData().properties ? this.getData().properties.getAll().placemarkData.address : this.getData().address,
                        coords: this.getData().properties ? this.getData().properties.getAll().placemarkData.coords : this.getData().coords
                    });
                    // Добавление отзыва в список
                    listComment.firstElementChild.firstElementChild.firstElementChild ? 
                    listComment.firstElementChild.firstElementChild.innerHTML += commentHbs({name: name.value, place: place.value, comment: comment.value, date: this.createDate(new Date())})
                        : listComment.firstElementChild.firstElementChild.innerHTML = commentHbs({name: name.value, place: place.value, comment: comment.value, date: this.createDate(new Date())});
                    
                    let myPlacemark = this.addPointOnMap.call(this, placemarks[placemarks.length - 1]);

                    clusterer.add(myPlacemark);
                    myMap.geoObjects.add(clusterer);

                    listComment.scrollTop = listComment.scrollHeight;
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
            createDate(date){
                return  `${date.getDate() < 10 ? `0${date.getData()}` : date.getDate()}.${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}.${date.getFullYear()} 
                ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
            }
        }
    ),
    BalloonContentLayout = ymaps.templateLayoutFactory.createClass(
        `{% if properties.placemarkData %}
            <li class="comment-item">
                <span class="name">{{properties.placemarkData.name}}</span>
                <span class="place">{{properties.placemarkData.place}}</span>
                <span class="date">{{properties.placemarkData.date}}</span>
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
                let link = document.querySelector('#address');

                link.removeEventListener('click', this.clickOnAddress);

                this.constructor.superclass.clear.call(this);
            },
            clickOnAddress(e){
                e.preventDefault();
                let coords = this.getData().properties.getAll().placemarkData.coords,
                    address = this.getData().properties.getAll().placemarkData.address,
                    foundPlacemarks = [];
                // поиск всех точек соответствующих адресу
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
            // Добавление найденных точек в список
            render(foundPlacemarks) {
                let span = document.createElement('span');

                for(let comment of foundPlacemarks) {
                    span.innerHTML += commentHbs({name: comment.name, place: comment.place, comment: comment.comment, date: comment.date});
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
