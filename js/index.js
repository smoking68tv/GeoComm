ymaps.ready(init);

function init(){ 
    // Создание карты.    
    let myMap = new ymaps.Map("map", {
        center: [56.8375,60.5985],
        zoom: 13,
        controls: ['zoomControl']
    });

    myMap.events.add('click', (e) => {  
        const coords = e.get('coords');
        
        ymaps.geocode(coords).then((res) => {
            let address = res.geoObjects.get(0).properties.get('text');
            console.log(coords)
            myMap.balloon.open(coords,{
                coords: coords,                    
                address: address,                   
                content: ''
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
                <ul id="referenceList" class="panel-references">                    
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
        </div>`,{
            closeButton: document.querySelector('#closeButton'),
            addButton: document.querySelector('#addButton'),
            build(){
                this.constructor.superclass.build.call(this);
                console.log('build');
            },
            clear(){
                this.constructor.superclass.clear.call(this);
            },
            getShape() {
                return new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([ [0, 0], [380, 530] ]));
            },
        }
    ),
    BalloonContentLayout = ymaps.templateLayoutFactory.createClass(
     
    )
    
}
