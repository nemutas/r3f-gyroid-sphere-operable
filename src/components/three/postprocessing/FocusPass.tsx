import React, { useRef, VFC } from 'react';
import THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { useFrame } from '@react-three/fiber';
import { GUIController } from '../../../modules/gui';

const datas = {
	enabled: true,
	focus: -0.05,
	blur: 1,
	samples: 20
}

export const FocusPass: VFC = () => {
	const passRef = useRef<ShaderPass>(null)

	const gui = GUIController.instance.setFolder('Focus')
	gui.setOpen(false)
	gui.addCheckBox(datas, 'enabled')
	gui.addNumericSlider(datas, 'focus', -0.5, 0.5, 0.01)
	gui.addNumericSlider(datas, 'blur', 0, 1, 0.01)
	gui.addNumericSlider(datas, 'samples', 10, 100, 10)

	const shader: THREE.Shader = {
		uniforms: {
			tDiffuse: { value: null },
			u_focus: { value: datas.focus },
			u_blur: { value: datas.blur },
			u_samples: { value: datas.samples }
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader
	}

	const update = () => {
		passRef.current!.enabled = datas.enabled

		if (datas.enabled) {
			passRef.current!.uniforms.u_focus.value = datas.focus
			passRef.current!.uniforms.u_blur.value = datas.blur
			passRef.current!.uniforms.u_samples.value = datas.samples
		}
	}

	useFrame(() => {
		update()
	})

	return <shaderPass ref={passRef} attachArray="passes" args={[shader]} />
}

const vertexShader = `
varying vec2 v_uv;

void main() {
  v_uv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

const fragmentShader = `
uniform sampler2D tDiffuse;
uniform float u_focus;
uniform float u_blur;
uniform int u_samples;
varying vec2 v_uv;

const int MAX_SAMPLES = 100;
const float PI = 3.14159265358979;

vec2 getDirection(float angle) {
  return vec2(sin(2.0 * PI * angle), cos(2.0 * PI * angle));
}

void main() {
  vec4 tex = vec4(0.0);

  float len = distance(v_uv, vec2(0.5));
  float focus = smoothstep(u_focus, 1.0, len);

  vec2 dir1 = getDirection(0.0 / 8.0);
  vec2 dir2 = getDirection(1.0 / 8.0);
  vec2 dir3 = getDirection(2.0 / 8.0);
  vec2 dir4 = getDirection(3.0 / 8.0);
  vec2 dir5 = getDirection(4.0 / 8.0);
  vec2 dir6 = getDirection(5.0 / 8.0);
  vec2 dir7 = getDirection(6.0 / 8.0);
  vec2 dir8 = getDirection(7.0 / 8.0);

  for(int i = 0; i < MAX_SAMPLES; i++) {
    if(i == u_samples) break;

    float ratio = focus * float(i) * 0.001 * u_blur;

    tex += texture2D(tDiffuse, v_uv + dir1 * ratio);
    tex += texture2D(tDiffuse, v_uv + dir2 * ratio);
    tex += texture2D(tDiffuse, v_uv + dir3 * ratio);
    tex += texture2D(tDiffuse, v_uv + dir4 * ratio);
    tex += texture2D(tDiffuse, v_uv + dir5 * ratio);
    tex += texture2D(tDiffuse, v_uv + dir6 * ratio);
    tex += texture2D(tDiffuse, v_uv + dir7 * ratio);
    tex += texture2D(tDiffuse, v_uv + dir8 * ratio);
  }
  tex /= float(u_samples) * 8.0;
  
  gl_FragColor = tex;
}
`
