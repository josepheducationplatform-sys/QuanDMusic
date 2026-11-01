"""Musical sanity checks on the separated SATB score."""

from __future__ import annotations

from itertools import pairwise

from music21 import note, stream

from .satb import Flag

# Generous limits (MIDI numbers); notes outside are flagged for review, not changed.
RANGES = {
    "Soprano": (58, 84),  # Bb3 - C6
    "Alto": (53, 77),  # F3 - F5
    "Tenor": (45, 69),  # A2 - A4
    "Bass": (36, 64),  # C2 - E4
}
MAX_LEAP = 12


def check_ranges(part: stream.Part, flags: list[Flag]) -> None:
    lo, hi = RANGES.get(part.partName, (0, 127))
    for n in part.recurse().getElementsByClass(note.Note):
        if not lo <= n.pitch.midi <= hi:
            m = n.getContextByClass(stream.Measure)
            flags.append(
                Flag(
                    part.partName,
                    m.number if m else None,
                    float(n.offset),
                    "range",
                    f"{n.nameWithOctave} is outside the usual {part.partName} range",
                )
            )


def check_leaps(part: stream.Part, flags: list[Flag]) -> None:
    prev = None
    for n in part.recurse().getElementsByClass(note.Note):
        if prev is not None and abs(n.pitch.midi - prev.pitch.midi) > MAX_LEAP:
            m = n.getContextByClass(stream.Measure)
            flags.append(
                Flag(
                    part.partName,
                    m.number if m else None,
                    float(n.offset),
                    "leap",
                    f"leap {prev.nameWithOctave} -> {n.nameWithOctave} larger than an octave",
                )
            )
        prev = n


def check_crossings(score: stream.Score, flags: list[Flag]) -> None:
    parts = {p.partName: p.flatten().notes.stream() for p in score.parts}
    pairs = [("Soprano", "Alto"), ("Alto", "Tenor"), ("Tenor", "Bass")]
    for upper, lower in pairs:
        if upper not in parts or lower not in parts:
            continue
        low = parts[lower]
        for n in parts[upper].getElementsByClass(note.Note):
            other = low.getElementAtOrBefore(n.offset, [note.Note])
            if other is None or other.offset + other.quarterLength <= n.offset:
                continue
            if other.pitch.midi > n.pitch.midi:
                m = n.getContextByClass(stream.Measure)
                flags.append(
                    Flag(
                        f"{upper}/{lower}",
                        m.number if m else None,
                        None,
                        "crossing",
                        f"{upper} {n.nameWithOctave} below {lower} {other.nameWithOctave}",
                    )
                )


def check_suspicious_rests(score: stream.Score, flags: list[Flag]) -> None:
    """Suggest long rests for review when multiple other voices are active."""
    parts = list(score.parts)
    measures_by_part = [list(part.getElementsByClass(stream.Measure)) for part in parts]
    for part_index, part in enumerate(parts):
        for measure_index, measure in enumerate(measures_by_part[part_index]):
            other_notes: list[tuple[int, float, float]] = []
            for other_index, measures in enumerate(measures_by_part):
                if other_index == part_index or measure_index >= len(measures):
                    continue
                other_measure = measures[measure_index]
                for n in other_measure.recurse().getElementsByClass(note.Note):
                    start = float(n.getOffsetInHierarchy(other_measure))
                    other_notes.append((other_index, start, start + float(n.quarterLength)))

            for rest in measure.recurse().getElementsByClass(note.Rest):
                duration = float(rest.quarterLength)
                if duration < 2.0:
                    continue
                start = float(rest.getOffsetInHierarchy(measure))
                end = start + duration
                boundaries = {start, end}
                for _, note_start, note_end in other_notes:
                    if note_start < end and note_end > start:
                        boundaries.add(max(start, note_start))
                        boundaries.add(min(end, note_end))
                ordered = sorted(boundaries)
                active_duration = 0.0
                for left, right in pairwise(ordered):
                    midpoint = (left + right) / 2
                    active_parts = {
                        other_index
                        for other_index, note_start, note_end in other_notes
                        if note_start <= midpoint < note_end
                    }
                    if len(active_parts) >= 2:
                        active_duration += right - left
                if active_duration / duration >= 0.6:
                    flags.append(
                        Flag(
                            part.partName,
                            measure.number,
                            start,
                            "possible-missed-notes",
                            f"{duration:g}-beat rest while at least two other voices are active for "
                            f"{active_duration / duration:.0%} of it; verify against the score "
                            "(no notes were inferred)",
                        )
                    )


def validate(score: stream.Score) -> list[Flag]:
    flags: list[Flag] = []
    for p in score.parts:
        check_ranges(p, flags)
        check_leaps(p, flags)
    check_crossings(score, flags)
    check_suspicious_rests(score, flags)
    return flags
