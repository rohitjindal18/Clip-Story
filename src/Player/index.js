import React from 'react';
import flowplayer from 'flowplayer';
import { throttle } from '../utils';

export default class Player extends React.PureComponent {

    initializePlayer = () => {
        const {
            videos,
            setPlayer
        } = this.props;
        flowplayer(this.player, {
            // playlist: videos,
            autoplay: true,
            clip: videos && videos[0],
            preload: 'auto'
        }).on('ready', (api, root, video) => {
            root.mute(true);
            setPlayer(root);
        }).on('pause', (e, root) => {
            if (root.video.time < root.video.duration && !this.props.userPaused) {
                root.resume();
            }
        }).on('finish', (e, root) => {
            this.props.onVideoFinished(root);
        }).on('progress', throttle((api, root,time) => {
            this.props.onProgress(root, time);
        }, 1000));
    }

    componentDidMount() {
        this.initializePlayer();
    }

    setRef = (ref) => {
        this.player = ref;
    }

    render() {
        return(
            <div ref={this.setRef} id='player' preload='auto'/>
        );
    }
}