from music21 import note, stream

from satb_omr.validate import validate


def _part(name, elements):
    part = stream.Part(id=name)
    part.partName = name
    measure = stream.Measure(number=1)
    for element in elements:
        measure.append(element)
    part.append(measure)
    return part


def test_long_rest_with_multiple_active_voices_is_reviewed_without_editing_score():
    score = stream.Score(
        [
            _part("Soprano", [note.Note("C5", quarterLength=4)]),
            _part("Alto", [note.Rest(quarterLength=4)]),
            _part("Tenor", [note.Note("G3", quarterLength=4)]),
            _part("Bass", [note.Note("C3", quarterLength=4)]),
        ]
    )
    before = [
        tuple(
            (type(element), element.pitch.nameWithOctave if isinstance(element, note.Note) else element.quarterLength)
            for element in part.recurse().notesAndRests
        )
        for part in score.parts
    ]

    flags = validate(score)

    suggestions = [flag for flag in flags if flag.kind == "possible-missed-notes"]
    assert len(suggestions) == 1
    assert suggestions[0].voice == "Alto"
    assert "no notes were inferred" in suggestions[0].message
    after = [
        tuple(
            (type(element), element.pitch.nameWithOctave if isinstance(element, note.Note) else element.quarterLength)
            for element in part.recurse().notesAndRests
        )
        for part in score.parts
    ]
    assert after == before


def test_long_rest_is_not_flagged_when_fewer_than_two_other_voices_are_active():
    score = stream.Score(
        [
            _part("Soprano", [note.Note("C5", quarterLength=4)]),
            _part("Alto", [note.Rest(quarterLength=4)]),
            _part("Tenor", [note.Rest(quarterLength=4)]),
            _part("Bass", [note.Rest(quarterLength=4)]),
        ]
    )

    assert not [flag for flag in validate(score) if flag.kind == "possible-missed-notes"]
