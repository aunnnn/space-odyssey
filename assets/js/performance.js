/* Covered GPU warm-up: real draws, not compile-only, while the loading cover is present. */
window.SpaceVoyagePerf = (function () {
  'use strict';
  var target = new THREE.Vector3();

  function collect(scene, renderer) {
    var textures = [], geometries = [];
    scene.traverse(function (object) {
      if (object.geometry && geometries.indexOf(object.geometry) < 0) geometries.push(object.geometry);
      if (!object.material) return;
      var materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(function (material) {
        Object.keys(material).forEach(function (key) {
          var value = material[key];
          if (value && value.isTexture && textures.indexOf(value) < 0) {
            textures.push(value);
            renderer.initTexture(value);
          }
        });
      });
    });
    return { textures: textures, geometries: geometries };
  }

  function warm(options) {
    var renderer = options.renderer, scene = options.scene, camera = options.camera;
    var skyDome = options.skyDome, views = options.views;
    var resources = collect(scene, renderer);
    renderer.compile(scene, camera);
    var warmTarget = new THREE.WebGLRenderTarget(32, 32, { depthBuffer: true, stencilBuffer: false });
    var savedPosition = camera.position.clone();
    var savedQuaternion = camera.quaternion.clone();
    var previousTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(warmTarget);
    views.forEach(function (view) {
      camera.position.fromArray(view.p);
      target.fromArray(view.t);
      camera.lookAt(target);
      skyDome.position.copy(camera.position);
      renderer.render(scene, camera);
    });
    renderer.setRenderTarget(previousTarget);
    warmTarget.dispose();
    camera.position.copy(savedPosition);
    camera.quaternion.copy(savedQuaternion);
    skyDome.position.copy(camera.position);
    return { textureCount: resources.textures.length, geometryCount: resources.geometries.length, warmPasses: views.length };
  }

  return { warm: warm };
})();
