import axios from "axios";
import "../styles/musicCard.css";
import React from "react";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import getMusicInfo from "./helpers/music_info";
import { bindActionCreators } from "redux";
import { actionCreators } from "../state";
import { sendMusic } from "../state/action-creators";
import { useNavigate } from "react-router-dom";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { PiHeartStraightFill, PiHeartStraightLight } from "react-icons/pi";
import { ImLoop } from "react-icons/im";


const server = process.env.REACT_APP_SERVER;
const targetItags = [141, 251, 140, 171];
const host = process.env.REACT_APP_AUTH_SERVER;

const MusicCard = () => {
  const audioRef = useRef();
  const isSeekBarFocused = useRef(false);

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const navigate = useNavigate();

  const [seekValue, setSeekValue] = useState(0);
  const currMusic = useSelector((state) => state.music);
  const queueIndex = useSelector((state) => state.queueIndex);
  const queue = useSelector((state) => state.queue);
  const [playerState, setPlayerState] = useState(0);
  const [player, setPlayer] = useState(null);
  const [currDuration, setCurrDuration] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const musicInfo = useSelector((state) => state.musicInfo);
  const videoRef = useSelector((state) => state.audioRef);
  const [thumbUrl, setThumbUrl] = useState(
    currMusic.thumbnails ? currMusic.thumbnails[0].url : null
  );
  const objToStream = musicInfo
    ? musicInfo.streamingData.adaptiveFormats.find((obj) =>
        targetItags.includes(obj.itag)
      )
    : null;

  const dispatch = useDispatch();
  const { sendQueueIndex, sendMusic, sendAddHistoryResponse, sendMusicInfo, sendAudioRef } = bindActionCreators(
    actionCreators,
    dispatch
  );

  const handleSpaceKeyPress = (event) => {
    if (
      event.key === " " &&
      ((document.activeElement.tagName.toLowerCase() === 'input' && document.activeElement.type == 'range') ||
      document.activeElement.tagName.toLowerCase() !== 'input'
      )
    ) {
      // Prevent default spacebar behavior (scrolling the page)
      event.preventDefault();
      // Toggle play/pause
      handlePlayPause();
    }
  };

  useEffect(() => {
    if(!isLoggedIn){
      if(currDuration)
        player.pause();
      navigate('/login');
    }
    else if(currDuration)
      player.play();
  },[isLoggedIn])

  useEffect(() => {
    const handleTimeUpdate = () => {
      setPlayerState(audioRef.current.paused ? 2 : 1);
    };
    if (audioRef.current)
      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      if (audioRef.current)
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [audioRef.current]);

  useEffect(() => {
    // Add event listener when the component mounts
    window.addEventListener("keydown", handleSpaceKeyPress);
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleSpaceKeyPress);
    };
  }, [playerState]);

  useEffect(() => {
    if (currMusic) {
      getMusicInfo(currMusic.videoId)
        .then((response) => {
          if(response.data.playabilityStatus.status == 'OK'){
            sendMusicInfo(response.data);
            setThumbUrl(
              response.data.videoDetails.thumbnail.thumbnails.pop().url
            );
            }
          else{
            setOpen(true);
            setSnackMsg(`${response.data.playabilityStatus.status}: ${response.data.playabilityStatus.reason}`);
          }
        })
        .catch((error) => {
          console.error("Request error:", error.message);
        });
    }
  }, [currMusic]);

  useEffect(() => {
    if ("mediaSession" in navigator && musicInfo) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: musicInfo.videoDetails.title,
        artist: musicInfo.videoDetails.author,
        artwork: [{ src: thumbUrl, type: "image/png" }],
      });
    }
  }, [musicInfo]);

  const seekTo = (event) => {
    const newValue = parseInt(event.target.value);
    const seekTime = (newValue / 100) * totalDuration;
    player.currentTime = seekTime;
  };

  function formatTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(timeInSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }
  const addToHistory = async (music) => {
    try {
      const response = await axios.post(`${host}api/songs/addhistory`, { music }, {
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      });
  
      sendAddHistoryResponse(response);
    } catch (error) {
      // Handle errors
      console.error("Error adding to history:", error.message);
    }
  };
  useEffect(() => {
    sendAudioRef(audioRef);
  },[audioRef])

  const handleReady = () => {
    setPlayer(audioRef.current);
    sendAudioRef(audioRef);
    setCurrDuration(0);
    setSeekValue(0);
    setTotalDuration(audioRef.current.duration);
    if (isLoggedIn && audioRef.current.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA && videoRef.current.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA){
      console.log('audio ready')
       audioRef.current.play();
       videoRef.current.play();
    }
    addToHistory(currMusic);
  };

  const handlePlayPause = () => {
    if (playerState === 1) {
      player.pause();
    } else if (isLoggedIn) player.play();
  };

  const handleSeekBarFocus = () => {
    isSeekBarFocused.current = true;
  };

  const handleSeekBarBlur = () => {
    isSeekBarFocused.current = false;
  };

  const handleNext = () => {
    if (queue.length > queueIndex + 1) {
      sendMusic(queue[queueIndex + 1]);
      sendQueueIndex(queueIndex + 1);
    }
  };

  const handlePrev = () => {
    if (queueIndex > 0) {
      sendMusic(queue[queueIndex - 1]);
      sendQueueIndex(queueIndex - 1);
    }
  };

  const handleEnd = () => {
    handleNext();
  };

  const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });
  
    const [open, setOpen] = useState(false);
    const [snackMsg, setSnackMsg] = useState();
  
    const handleCloseSnack = (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }
  
      setOpen(false);
    };

    const addToLiked = async (music) => {
      try {
        setIsLiked(true);
        const response = await axios.post(`${host}api/songs/addliked`, { music }, {
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        });
      } catch (error) {
        // Handle errors
        console.error("Error liking:", error.message);
        setIsLiked(false);
      }
    };

    const removeFromLiked = async (videoId) => {
      try {
        setIsLiked(false);
        const response = await axios.delete(`${host}api/songs/deleteLiked/${videoId}`, {
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        });
      } catch (error) {
        // Handle errors
        console.error("Error liking:", error.message);
        setIsLiked(true);
      }
    };
  
    const [isLiked, setIsLiked] = useState('loading');
    useEffect(() => {
      setIsLiked('loading');
      const config = {
        headers: {"auth-token" : localStorage.getItem('token')}
    }
      axios.get(`${host}api/songs/checkLiked/${currMusic.videoId}`, config)
      .then(response => {
        console.log(response.data); // This will log the result from the API
        setIsLiked(response.data.exists);
      })
      .catch(error => {
        console.error("Error making API request:", error.message);
      });
    }, [currMusic])

  navigator.mediaSession.setActionHandler("nexttrack", handleNext);
  navigator.mediaSession.setActionHandler("previoustrack", handlePrev);

  
  const playPauseBtnClass = "fa fa-" + (playerState === 1 ? "pause" : "play");
  const waveClass = playerState !== 1 ? "wave" : "wave paused";
  return (
    <div className="music-card">
      {objToStream && (
        <audio
          src={objToStream.url}
          className="ytplayer"
          onLoadedMetadata={handleReady}
          ref={audioRef}
          onEnded={handleEnd}
        />
      )}

      <div className="thumbnail">
        {currMusic && <img alt="Music Art" src={thumbUrl} />}
      </div>
      <div className={waveClass}></div>
      <div className={waveClass}></div>
      <div className={waveClass}></div>
      {musicInfo && (
        <section className="player__body">
          <p className="title">{musicInfo.videoDetails.title}</p>
          <p className="subtitle">{musicInfo.videoDetails.author}</p>
        </section>
      )}
      <div className="slider_container">
        <div className="current-time">{formatTime(currDuration)}</div>
        <input
          type="range"
          min="1"
          max="100"
          value={seekValue}
          className="seek_slider"
          onChange={seekTo}
          onMouseDown={handleSeekBarFocus}
          onMouseUp={handleSeekBarBlur}
          onTouchStart={handleSeekBarFocus}
          onTouchEnd={handleSeekBarBlur}
        />
        <SeekBarUpdater
          player={player}
          playerState={playerState}
          totalDuration={totalDuration}
          setCurrDuration={setCurrDuration}
          setSeekValue={setSeekValue}
          isSeekBarFocused={isSeekBarFocused}
        />
        <div className="current-time">{formatTime(totalDuration)}</div>
      </div>

      <div className="buttons">
        <ul className="list list--buttons" onClick={(e) => e.preventDefault()}>
          <li className="liked list__link" >
            {isLiked === true ? <PiHeartStraightFill size={25} color="red" style={{cursor:'pointer'}} onClick={() => removeFromLiked(currMusic.videoId)} />:
            <PiHeartStraightLight size={25} color={isLiked === 'loading' ? "gray" : "red"} style={{cursor:'pointer'}} onClick={() => addToLiked(currMusic)} />}
          </li>
          <li>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a className="list__link">
              <i className="fa fa-step-backward" onClick={handlePrev}></i>
            </a>
          </li>

          <li>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a className="list__link" onClick={handlePlayPause}>
              <i className={playPauseBtnClass}></i>
            </a>
          </li>

          <li>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a className="list__link" onClick={handleNext}>
              <i className="fa fa-step-forward"></i>
            </a>
          </li>
          <li className="list__link shuffle">
            <ImLoop size={20} />
          </li>
        </ul>
      </div>
      <Snackbar open={open} autoHideDuration={3000} onClose={handleCloseSnack}>
        <Alert onClose={handleCloseSnack} severity="error" sx={{  left:0,width: '300px' ,position: 'absolute', bottom: 10,}}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </div>
  );
};

const SeekBarUpdater = ({
  player,
  playerState,
  totalDuration,
  setCurrDuration,
  setSeekValue,
  isSeekBarFocused,
}) => {
  const updateSeekBar = () => {
    const currentTime = player.currentTime;
    if (currentTime !== null) {
      setCurrDuration(currentTime);
      if (!isSeekBarFocused.current) {
        setSeekValue((currentTime / totalDuration) * 100);
      }
    }
    if (playerState === 1) {
      requestAnimationFrame(updateSeekBar);
    }
  };

  useEffect(() => {
    if (playerState === 1) {
      updateSeekBar();
    }
  }, [
    playerState,
    player,
    totalDuration,
    setCurrDuration,
    setSeekValue,
    isSeekBarFocused,
  ]);

  return null; // This component doesn't render anything
};

export default MusicCard;
