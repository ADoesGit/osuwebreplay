/**
 * music_controller.js
 * Created by Ugrend on 9/06/2016.
 */
var osu = osu || {};
osu.audio = osu.audio || {};
osu.audio.music =  {

    preview_screen: false,
    preview_time: 0,
    __audio: new Audio(),
    md5sum: "",
    playing: false,
    events_bound: false,

    init: function (src, md5sum) {

        if(!this.events_bound){
            event_handler.on(event_handler.EVENTS.SETTINGS_CHANGED, this.set_volume.bind(this));
            this.events_bound = true;
        }
        //only start again
        if(src && md5sum != this.md5sum){
            this.md5sum = md5sum;
            this.__audio.pause();
            this.__audio.src = src;
            this.set_volume();
            this.playing = false;
        }
        this.set_playback_speed(1);//reset playback speed if was playing DT/HT

        //TODO: this is corrupting datauri audio on chrome some how
        //this.__audio.onended = this.repeat.bind(this);

    },
    set_volume: function () {
        this.__audio.volume = osu.settings.SETTINGS.master_volume * osu.settings.SETTINGS.music_volume;
    },

    stop: function () {
        this.__audio.pause();
        this.__audio.currentTime = 0;
    },

    start: function(){
        if(this.preview_screen){
            if(!this.playing){
                this.__audio.currentTime = this.preview_time;
                this.__audio.play();
                this.playing = true;
            }

        }
        else{
            this.__audio.currentTime = 0;
            this.__audio.play();
        }

    },
    set_position: function (t) {
        this.__audio.currentTime = t;
    },

    play: function(){
        this.__audio.play()
    },
    pause: function () {
        this.__audio.pause();
    },
    set_playback_speed: function (rate) {
        this.__audio.playbackRate = rate;

    },

    repeat: function () {
        if(this.preview_screen){
            this.playing = false;
            this.start();
        }

    }












};

