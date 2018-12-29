import React from 'react';
import flowplayer from 'flowplayer';

export default class Player extends React.PureComponent {

    initializePlayer = () => {
        const {
            videos,
            setPlayer
        } = this.props;
        flowplayer(this.player, {
            playlist: videos,
            autoplay: true,
            clip: videos && videos[0]
        }).on('ready', (api, root, video) => {
            setPlayer(root);
        }).on('pause', (e, root) => {
            if (root.video.time < root.video.duration && !this.props.userPaused) {
                root.resume();
            }
        }).on('finish', (e, root) => {
            root.next();
        });
    }

    componentDidMount() {
        this.initializePlayer();
    }

    setRef = (ref) => {
        this.player = ref;
    }

    render() {
        return(
            <div ref={this.setRef} id='player'/>
        );
    }
}