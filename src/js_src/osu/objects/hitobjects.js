/**
 * hitobjects.js
 * Created by Ugrend on 17/06/2016.
 */

osu = osu || {};
osu.objects = osu.objects || {};
osu.objects.hitobjects = {
    TYPES: {
        CIRCLE: 1,
        SLIDER: 2,
        NEW_COMBO: 4,
        SPINNER: 8,
    },

    HIT_SOUNDS: {
        SOUND_NORMAL: 0,
        SOUND_WHISTLE: 2,
        SOUND_FINISH: 4,
        SOUND_CLAP: 8,
    },
    HIT_ADDITIONS: {
        NORMAL: 1,
        SOFT: 2,
        DRUM: 3,
    },

    SLIDER_TYPES: {
        CATMULL: "C",
        BEZIER: "B",
        LINEAR: "L",
        PASSTHROUGH: "P"
    },

    parse_type: function (hitObjectInt) {
        var newCombo = false;
        if ((hitObjectInt & this.TYPES.NEW_COMBO)) {
            newCombo = true;
        }
        if ((hitObjectInt & osu.objects.hitobjects.TYPES.CIRCLE)) {
            return {type: this.TYPES.CIRCLE, new_combo: newCombo}
        }
        if ((hitObjectInt & osu.objects.hitobjects.TYPES.SLIDER)) {
            return {type: this.TYPES.SLIDER, new_combo: newCombo}
        }
        if ((hitObjectInt & osu.objects.hitobjects.TYPES.SPINNER)) {
            return {type: this.TYPES.SPINNER, new_combo: newCombo}
        }
    },
    parse_line: function (line, timing, sliderMulti) {

        var get_timing_point = function (offset) {
            for(var i = timing.length -1 ; i >=0 ; i--){
                if(timing[i].offset <= offset)  return timing[i];
            }
            return timing[0];
        };

        var parse_additions = function (strAdditions) {
            if(!strAdditions) return {};
            var additions = {};
            var adds = strAdditions.split(":");
            if(adds.length > 0){
                additions.sample = +adds[0];
            }
            if(adds.length > 1){
                additions.additionalSample = +adds[1];
            }
            if(adds.length > 2){
                additions.customSampleIndex = +adds[2];
            }
            if(adds.length > 3){
                additions.hitSoundVolume = +adds[3];
            }
            if(adds.length > 4){
                additions.hitsound = +adds[4];
            }

            return {};
        };

        var hitObject = {};

        var hitArray = line.split(',');

        var type = this.parse_type(+hitArray[3]);

        hitObject.x = +hitArray[0];
        hitObject.y = +hitArray[1];
        hitObject.startTime = +hitArray[2];
        hitObject.type = type.type;
        hitObject.newCombo = type.new_combo;
        hitObject.hitSounds = [];
        hitObject.timing = get_timing_point(hitObject.startTime);

        var soundByte = +hitArray[4];
        if ((soundByte & this.HIT_SOUNDS.SOUND_WHISTLE) == this.HIT_SOUNDS.SOUND_WHISTLE)
            hitObject.hitSounds.push(this.HIT_SOUNDS.SOUND_WHISTLE);
        if ((soundByte & this.HIT_SOUNDS.SOUND_FINISH) == this.HIT_SOUNDS.SOUND_FINISH)
            hitObject.hitSounds.push(this.HIT_SOUNDS.SOUND_FINISH);
        if ((soundByte & this.HIT_SOUNDS.SOUND_CLAP) == this.HIT_SOUNDS.SOUND_CLAP)
            hitObject.hitSounds.push(this.HIT_SOUNDS.SOUND_CLAP);
        if (hitObject.hitSounds.length === 0)
            hitObject.hitSounds.push(this.HIT_SOUNDS.NORMAL);


        if (hitObject.type == this.TYPES.CIRCLE) {
            hitObject.additions = parse_additions(hitArray[5]);
        }
        if (hitObject.type == this.TYPES.SPINNER) {
            hitObject.endTime = +hitArray[5];
            hitObject.additions = +hitArray[6];
        }
        if (hitObject.type == this.TYPES.SLIDER) {
            var sliderData = hitArray[5].split("|");
            hitObject.sliderType = sliderData[0];
            hitObject.repeatCount = +hitArray[6];
            hitObject.pixelLength = +hitArray[7];
            hitObject.additions = parse_additions(hitArray[10]);
            hitObject.edges =[];
            hitObject.points = [];
            for(var i = 1; i < sliderData.length; i++){
                var points = sliderData[i].split(":");
                hitObject.points.push({x:+points[0], y:+points[1]});
            }


            var beats = (hitObject.pixelLength * hitObject.repeatCount) /(100*sliderMulti)
            hitObject.duration = Math.ceil(beats * hitObject.timing.millisecondsPerBeat);
            hitObject.endTime = hitObject.startTime + hitObject.duration;

        }


        return hitObject;
    },


    //https://gist.github.com/peppy/1167470
    create_stacks: function (hitobjects, stackLeniency, circleSize, hardrock) {

        for (var i = hitobjects.length - 1; i > 0; i--) {
            var hitObjectI = hitobjects[i].object;
            if (hitObjectI.stack != 0 || hitObjectI.type == "spinner") continue;

            if (hitObjectI.type == "circle") {
                for (var n = i - 1; n >= 0; n--) {
                    var hitObjectN = hitobjects[n].object;
                    if (hitObjectN.type == "spinner") continue;

                    var timeI = hitObjectI.hit_time - (1000 * stackLeniency); //convert to miliseconds
                    var timeN = hitObjectN.hit_time;
                    if (timeI > timeN) break;

                    var distance = osu.helpers.math.distance(hitObjectI.x, hitObjectI.y, hitObjectN.x, hitObjectN.y);
                    if (distance < 3) {
                        hitObjectN.stack = hitObjectI.stack + 1;
                        hitObjectI = hitObjectN;
                    }

                }
            }
        }

        for (i = 0; i < hitobjects.length; i++) {
            var hitObject = hitobjects[i].object;
            var stack = hitObject.stack;
            var offset = (stack * (circleSize * 0.05));
            var x = hitObject.x - offset;
            var y = hitObject.y - offset;
            if (hardrock)
                y = y + offset;

            hitObject.x = x;
            hitObject.y = y;
            hitObject.init();
        }


    }

};
