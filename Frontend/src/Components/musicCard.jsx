import "../styles/musicCard.css";

import { useState } from "react";
import { useSelector } from 'react-redux';
import YouTube from 'react-youtube';

const MusicCard = () => {

  const [seekValue, setSeekValue] = useState(0);
  const currMusic = useSelector(state => state.music);
  // const [isPlaying, setIsPlaying] = useState(false);

  const seekTo = (event) => {
    const newValue = parseInt(event.target.value);
    setSeekValue(newValue);
  };

  const videoId = 'cf1PCl6AdPE';

  const opts = {
    height: '0',
    width: '0',
    playerVars: {
      VideoPlaybackQuality:'hd1080',
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      playsinline: 0
    }

  };

  return (
    <div className="music-card">
     {currMusic && <YouTube // if currMusic is present then render youtube iframe
      className="ytplayer"
      videoId={currMusic.videoId}
      opts={opts}
    />}
      <div className="image">
        {currMusic && <img
          alt="Music Art"
          src={currMusic.thumbnails[1].url}
        />}
      </div>
      <div className="wave"></div>
      <div className="wave"></div>
      <div className="wave"></div>
      <div className="slider_container">
        <div className="current-time">00:00</div>
        <input
          type="range"
          min="1"
          max="100"
          value={seekValue}
          className="seek_slider"
          onChange={seekTo}
        />
        <div className="total-duration">00:00</div>
      </div>

      <div className="buttons">
        <ul className="list list--buttons">
          <li>
            <a href="#" className="list__link">
              <i className="fa fa-step-backward"></i>
            </a>
          </li>

          <li>
            <a href="#" className="list__link" onClick={() => console.log({currMusic})}>
              <i className="fa fa-play"></i>
            </a>
          </li>

          <li>
            <a href="#" className="list__link">
              <i className="fa fa-step-forward"></i>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

const YouTubePlayer = (id) => {
  const videoId = {id};

  const opts = {
    height: '300',
    width: '300',
    playerVars: {
      VideoPlaybackQuality:'hd1080',
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
      playsinline: 0
    }

  };

  return (
    <YouTube
      videoId={videoId}
      opts={opts}
      // onStateChange={onPlayerPlaybackQualityChange}
      // onReady={onPlayerStateChange}
    />
  );
}

export default MusicCard;
