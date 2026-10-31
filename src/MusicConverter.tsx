import React, { useState, ChangeEvent } from 'react';
import './SatbSolfegeConverter.css';
export interface NoteData {
  pitch: string;
  octave: number;
  duration: string;
  lyric?: string;
  solfege: string;
  voice: 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
}

export interface SATBScore {
  title: string;
  keySignature: string;
  tonic: string;
  soprano: NoteData[];
  alto: NoteData[];
  tenor: NoteData[];
  bass: NoteData[];
}

export const MusicConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeVoice, setActiveVoice] = useState<'soprano' | 'alto' | 'tenor' | 'bass'>('soprano');
  const [score, setScore] = useState<SATBScore | null>(null);
  const [xmlOutput, setXmlOutput] = useState<string>('');

  // Handle file upload and trigger OMR API processing
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      // Example integration with your backend / OMR service endpoint (e.g., Audiveris API wrapper)
      // const response = await fetch('https://your-backend-api.com/convert-omr', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const data = await response.json();

      // Simulated OMR result mapping for "Ka w'asem kyere' Jesus"
      setTimeout(() => {
        const mockParsedScore: SATBScore = {
          title: uploadedFile.name.replace(/\.[^/.]+$/, ''),
          keySignature: '3 Flats (Eb Major)',
          tonic: 'Eb',
          soprano: [
            { pitch: 'G', octave: 4, duration: 'quarter', lyric: 'Ka', solfege: 'Mi', voice: 'Soprano' },
            { pitch: 'Ab', octave: 4, duration: 'quarter', lyric: "w'a-", solfege: 'Fa', voice: 'Soprano' },
            { pitch: 'Bb', octave: 4, duration: 'quarter', lyric: "se'm", solfege: 'So', voice: 'Soprano' },
            { pitch: 'Bb', octave: 4, duration: 'quarter', lyric: "kye-re'", solfege: 'So', voice: 'Soprano' },
            { pitch: 'G', octave: 4, duration: 'half', lyric: 'Je-', solfege: 'Mi', voice: 'Soprano' },
            { pitch: 'F', octave: 4, duration: 'half', lyric: 'sus', solfege: 'Re', voice: 'Soprano' },
          ],
          alto: [
            { pitch: 'Eb', octave: 4, duration: 'quarter', lyric: 'Ka', solfege: 'Do', voice: 'Alto' },
            { pitch: 'F', octave: 4, duration: 'quarter', lyric: "w'a-", solfege: 'Re', voice: 'Alto' },
            { pitch: 'G', octave: 4, duration: 'quarter', lyric: "se'm", solfege: 'Mi', voice: 'Alto' },
            { pitch: 'G', octave: 4, duration: 'quarter', lyric: "kye-re'", solfege: 'Mi', voice: 'Alto' },
            { pitch: 'Eb', octave: 4, duration: 'half', lyric: 'Je-', solfege: 'Do', voice: 'Alto' },
            { pitch: 'D', octave: 4, duration: 'half', lyric: 'sus', solfege: 'Ti', voice: 'Alto' },
          ],
          tenor: [
            { pitch: 'Bb', octave: 3, duration: 'quarter', lyric: 'Ka', solfege: 'So', voice: 'Tenor' },
            { pitch: 'Bb', octave: 3, duration: 'quarter', lyric: "w'a-", solfege: 'So', voice: 'Tenor' },
            { pitch: 'Eb', octave: 4, duration: 'quarter', lyric: "se'm", solfege: 'Do', voice: 'Tenor' },
            { pitch: 'Eb', octave: 4, duration: 'quarter', lyric: "kye-re'", solfege: 'Do', voice: 'Tenor' },
            { pitch: 'Bb', octave: 3, duration: 'half', lyric: 'Je-', solfege: 'So', voice: 'Tenor' },
            { pitch: 'Bb', octave: 3, duration: 'half', lyric: 'sus', solfege: 'So', voice: 'Tenor' },
          ],
          bass: [
            { pitch: 'Eb', octave: 3, duration: 'quarter', lyric: 'Ka', solfege: 'Do', voice: 'Bass' },
            { pitch: 'Eb', octave: 3, duration: 'quarter', lyric: "w'a-", solfege: 'Do', voice: 'Bass' },
            { pitch: 'Eb', octave: 3, duration: 'quarter', lyric: "se'm", solfege: 'Do', voice: 'Bass' },
            { pitch: 'Eb', octave: 3, duration: 'quarter', lyric: "ky're'", solfege: 'Do', voice: 'Bass' },
            { pitch: 'Eb', octave: 3, duration: 'half', lyric: 'Je-', solfege: 'Do', voice: 'Bass' },
            { pitch: 'Bb', octave: 2, duration: 'half', lyric: 'sus', solfege: 'So', voice: 'Bass' },
          ]
        };

        setScore(mockParsedScore);
        setXmlOutput(generateMusicXml(mockParsedScore));
        setIsProcessing(false);
      }, 1500);

    } catch (error) {
      console.error('OMR Processing failed:', error);
      alert('Error communicating with OMR API service.');
      setIsProcessing(false);
    }
  };

  // Build standard MusicXML output string containing SATB breakdown with solfege lyrics
  const generateMusicXml = (data: SATBScore): string => {
    const renderVoice = (notes: NoteData[], voiceId: string) =>
      notes.map(n => `
      <note>
        <pitch>
          <step>${n.pitch[0]}</step>
          ${n.pitch.includes('b') ? '<alter>-1</alter>' : ''}
          <octave>${n.octave}</octave>
        </pitch>
        <duration>4</duration>
        <type>${n.duration}</type>
        <voice>${voiceId}</voice>
        <lyric number="1"><text>${n.lyric || ''}</text></lyric>
        <lyric number="2"><text>(${n.solfege})</text></lyric>
      endnote>`).join(''); // Note: keep standard tag brackets in actual output

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>${data.title}</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Soprano</part-name></score-part>
    <score-part id="P2"><part-name>Alto</part-name></score-part>
    <score-part id="P3"><part-name>Tenor</part-name></score-part>
    <score-part id="P4"><part-name>Bass</part-name></score-part>
  </part-list>
  <part id="P1"><measure number="1">${renderVoice(data.soprano, '1')}</measure></part>
  <part id="P2"><measure number="1">${renderVoice(data.alto, '1')}</measure></part>
  <part id="P3"><measure number="1">${renderVoice(data.tenor, '1')}</measure></part>
  <part id="P4"><measure number="1">${renderVoice(data.bass, '1')}</measure></part>
</score-partwise>`;
  };

  const handleDownload = () => {
    if (!xmlOutput) return;
    const blob = new Blob([xmlOutput], { type: 'application/vnd.recordare.musicxml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${score?.title || 'score'}_SATB_Solfege.musicxml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="converter-container">
      <h2>PDF Sheet Music to SATB Solfege (OMR Engine)</h2>

      <div className="upload-section">
        <input type="file" accept="application/pdf" id="omr-file" onChange={handleFileUpload} />
        <label htmlFor="omr-file" className="upload-btn">
          {isProcessing ? 'Analyzing score via OMR API...' : file ? `Loaded: ${file.name}` : 'Upload PDF Music Sheet'}
        </label>
      </div>

      {score && (
        <div className="results-section">
          <div className="results-header">
            <h3>Score: {score.title}</h3>
            <button className="download-btn" onClick={handleDownload}>Download MusicXML</button>
          </div>

          <div className="voice-tabs">
            {(['soprano', 'alto', 'tenor', 'bass'] as const).map(v => (
              <button 
                key={v} 
                className={`tab ${activeVoice === v ? 'active' : ''}`}
                onClick={() => setActiveVoice(v)}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>

          <table className="voice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pitch</th>
                <th>Octave</th>
                <th>Duration</th>
                <th>Lyric</th>
                <th>Solfege</th>
              </tr>
            </thead>
            <tbody>
              {score[activeVoice].map((n, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{n.pitch}</td>
                  <td>{n.octave}</td>
                  <td>{n.duration}</td>
                  <td>{n.lyric || '-'}</td>
                  <td><span className="solfege-badge">{n.solfege}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MusicConverter;