import { render } from 'preact';
import { App } from './app.jsx';
// 글꼴은 앱 안에 넣어 둡니다. 외부(Google Fonts)로 요청이 나가지 않아요.
import '@fontsource/gothic-a1/400.css';
import '@fontsource/gothic-a1/700.css';
import '@fontsource/gothic-a1/800.css';
import '@fontsource/jua/400.css';
import './styles.css';

render(<App />, document.getElementById('app'));
