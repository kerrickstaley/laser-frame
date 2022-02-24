// These clearance values are on each side, so you need to double them to get a diameter.
// I found that 0.5 mm gives better results than 0.1-0.4 mm. The hole formed with engraving is slightly
// conical and with 0.1-0.3 mm the head gets wedged in rather than resting on the tabs.
// This also helps account for variance in nail head size (even when the nails are intended to be the
// same size).
const nail_head_clearance_mm = 0.5;
const nail_shank_clearance_mm = 0.1;
// nail_to_top_dist_mm is the distance from the center of the nail to the top of the frame when the piece is hanging.
// If you print a small test piece (e.g. 2x2 cm), this will be overridden so that the hole is centered.
const nail_to_top_dist_mm = 20.0;
const doc_margin_mm = 10.0;
// The engraving will "bleed" into the cut-away area by engrave_bleed_mm. This prevents weird artifacts at the boundary.
const engrave_bleed_mm = 0.5;
// We add extra_frame_size_mm to the width and height of the frame. One thing this accounts for is laser kerf. But kerf
// should only be 0.2 mm, not 1.0 mm. So what is the extra 0.8 mm? I don't know. The picture just always seems to hang
// off the frame if we don't add this.
const extra_frame_size_mm = 1.0;

function render(frame_elem, download_elem, {frame_width_mm, frame_height_mm, nail_head_diameter_mm, nail_shank_diameter_mm}={}) {
    removeChildren(frame_elem);

    const frame_width_with_extra = frame_width_mm + extra_frame_size_mm;
    const frame_height_with_extra = frame_height_mm + extra_frame_size_mm;

    let svg = SVG().addTo(frame_elem);
    svg.width((frame_width_with_extra + 2 * doc_margin_mm) + 'mm');
    svg.height((frame_height_with_extra + 2 * doc_margin_mm) + 'mm');

    svg.viewbox(0, 0, frame_width_with_extra + 2 * doc_margin_mm, frame_height_with_extra + 2 * doc_margin_mm);

    svg.rect(frame_width_with_extra, frame_height_with_extra).move(doc_margin_mm, doc_margin_mm).stroke({color: '#f00', width: 0.1}).fill({opacity: 0, color: '#000'});

    let hole_width = nail_head_diameter_mm + 2 * nail_head_clearance_mm;
    let hole_height = 2 * hole_width;
    let slot_width = nail_shank_diameter_mm + 2 * nail_shank_clearance_mm;
    // hole_to_top_dist is the distance from the top of the frame to the top of the etched shelf
    let hole_to_top_dist = Math.min(nail_to_top_dist_mm - hole_width / 2, (frame_height_with_extra - hole_height) / 2);

    // cusp_height is the vertical distance from the center of the insertion hole to the cusp on the shelf
    let cusp_height_cut = Math.sqrt((hole_width / 2) ** 2 - (slot_width / 2) ** 2);
    let cusp_height_engrave = Math.sqrt((hole_width / 2 - engrave_bleed_mm) ** 2 - (slot_width / 2 - engrave_bleed_mm) ** 2);

    let shelf_interior_curve_cut = [
        ['a', hole_width / 2, hole_width / 2, 0, 0, 0, -(hole_width / 2 - slot_width / 2), -cusp_height_cut],
        ['l', 0, cusp_height_cut - (hole_height - hole_width)],
        ['a', slot_width / 2, slot_width / 2, 0, 0, 0, -slot_width, 0],
        ['l', 0, hole_height - hole_width - cusp_height_cut],
        ['a', hole_width / 2, hole_width / 2, 0, 0, 0, -(hole_width / 2 - slot_width / 2), cusp_height_cut],
    ];

    let shelf_interior_curve_engrave = [
        ['a', hole_width / 2 - engrave_bleed_mm, hole_width / 2 - engrave_bleed_mm, 0, 0, 0, -(hole_width / 2 - slot_width / 2), -cusp_height_engrave],
        ['l', 0, cusp_height_engrave - (hole_height - hole_width)],
        ['a', slot_width / 2 - engrave_bleed_mm, slot_width / 2 - engrave_bleed_mm, 0, 0, 0, -slot_width + 2 * engrave_bleed_mm, 0],
        ['l', 0, hole_height - hole_width - cusp_height_engrave],
        ['a', hole_width / 2 - engrave_bleed_mm, hole_width / 2 - engrave_bleed_mm, 0, 0, 0, -(hole_width / 2 - slot_width / 2), cusp_height_engrave],
    ];

    let shelf_path_array = new SVG.PathArray(
        [
            ['M', frame_width_with_extra / 2 - hole_width / 2 + doc_margin_mm, hole_to_top_dist + hole_width / 2 + doc_margin_mm],
            ['a', hole_width / 2, hole_width / 2, 0, 0, 1, hole_width, 0],
            ['l', 0, hole_height - hole_width],
            ['l', -engrave_bleed_mm, 0],
        ]
        + shelf_interior_curve_engrave
        + [
            ['l', -engrave_bleed_mm, 0],
            ['z'],
        ]
    );
    svg.path(shelf_path_array).fill('#000');

    let cut_path_array = new SVG.PathArray(
        [['M', frame_width_with_extra / 2 + hole_width / 2 + doc_margin_mm, hole_to_top_dist + hole_height - hole_width / 2 + doc_margin_mm]]
        + shelf_interior_curve_cut
        + [
            ['a', hole_width / 2, hole_width / 2, 0, 0, 0, hole_width, 0],
            ['z'],
        ]
    );
    svg.path(cut_path_array).stroke({color: '#f00', width: 0.1}).fill({opacity: 0, color: '#000'});

    let download_a = document.querySelector('#download');
    let svg_txt = frame_elem.innerHTML;
    download_elem.setAttribute('href', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg_txt));
    let fname = 'frame_' + frame_width_mm + 'mm_x_' + frame_height_mm
        + 'mm_nail_' + nail_head_diameter_mm + 'mm_x_' + nail_shank_diameter_mm + 'mm.svg';
    download_elem.setAttribute('download', fname);
}

function removeChildren(elem) {
    while (elem.firstChild) {
        elem.firstChild.remove();
    }
}

function makeUpdate({frame_width_elem, frame_height_elem, nail_head_diameter_elem, nail_shank_diameter_elem, frame_elem, download_elem}={}) {
    function update() {
        const values = {
            frame_width_mm: parseFloat(frame_width_elem.value),
            frame_height_mm: parseFloat(frame_height_elem.value),
            nail_head_diameter_mm: parseFloat(nail_head_diameter_elem.value),
            nail_shank_diameter_mm: parseFloat(nail_shank_diameter_elem.value),
        };
        for (const [key, value] of Object.entries(values)) {
            if (isNaN(value)) {
                // If any values cannot be parsed, exit early and don't re-render.
                return;
            }
        }
        render(frame_elem, download_elem, values);
    }
    return update;
}

const frame_elem = document.querySelector('#laser-frame');
const download_elem = document.querySelector('#download');
const frame_width_elem = document.querySelector('#frame-width-mm');
const frame_height_elem = document.querySelector('#frame-height-mm');
const nail_head_diameter_elem = document.querySelector('#nail-head-diameter-mm');
const nail_shank_diameter_elem = document.querySelector('#nail-shank-diameter-mm');

let update_func = makeUpdate({
    frame_elem: frame_elem,
    download_elem: download_elem,
    frame_width_elem: frame_width_elem,
    frame_height_elem: frame_height_elem,
    nail_head_diameter_elem: nail_head_diameter_elem,
    nail_shank_diameter_elem: nail_shank_diameter_elem,
});

frame_width_elem.addEventListener("input", update_func);
frame_height_elem.addEventListener("input", update_func);
nail_head_diameter_elem.addEventListener("input", update_func);
nail_shank_diameter_elem.addEventListener("input", update_func);

update_func();
